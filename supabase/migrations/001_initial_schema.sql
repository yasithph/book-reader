-- Book Reader App - Initial Schema
-- =================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE purchase_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE language_preference AS ENUM ('en', 'si');
CREATE TYPE reader_theme AS ENUM ('light', 'dark', 'sepia');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(15) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    role user_role DEFAULT 'user' NOT NULL,
    language_preference language_preference DEFAULT 'si' NOT NULL,
    is_first_login BOOLEAN DEFAULT TRUE,

    -- Reader preferences
    reader_theme reader_theme DEFAULT 'light',
    font_size INTEGER DEFAULT 18 CHECK (font_size >= 12 AND font_size <= 32),
    line_spacing DECIMAL(2,1) DEFAULT 1.6 CHECK (line_spacing >= 1.0 AND line_spacing <= 2.5),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP verification table
CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT valid_attempts CHECK (attempts <= 5)
);

CREATE INDEX idx_otp_phone_expires ON public.otp_codes(phone, expires_at);

-- Books table
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Bilingual content
    title_en VARCHAR(255) NOT NULL,
    title_si VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_si TEXT,
    author_en VARCHAR(255) NOT NULL,
    author_si VARCHAR(255) NOT NULL,

    -- Media
    cover_image_url TEXT,

    -- Pricing
    price_lkr DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,

    -- Preview settings
    free_preview_chapters INTEGER DEFAULT 2,

    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    -- Stats
    total_chapters INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_books_published ON public.books(is_published, published_at DESC);

-- Chapters table
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

    -- Content
    chapter_number INTEGER NOT NULL,
    title_en VARCHAR(255),
    title_si VARCHAR(255),
    content TEXT NOT NULL,

    -- Stats
    word_count INTEGER DEFAULT 0,
    estimated_reading_time INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_chapters_book ON public.chapters(book_id, chapter_number);

-- Purchases table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

    -- Payment details
    amount_lkr DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(100),
    payment_proof_url TEXT,

    -- Status
    status purchase_status DEFAULT 'pending' NOT NULL,

    -- Admin handling
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_purchases_user ON public.purchases(user_id, status);
CREATE INDEX idx_purchases_pending ON public.purchases(status) WHERE status = 'pending';

-- Reading progress table
CREATE TABLE public.reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,

    -- Progress tracking
    scroll_position DECIMAL(5,2) DEFAULT 0,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),

    -- Completion tracking
    is_chapter_complete BOOLEAN DEFAULT FALSE,
    completed_chapters INTEGER[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- For sync
    client_updated_at TIMESTAMPTZ,

    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_progress_user ON public.reading_progress(user_id);
CREATE INDEX idx_progress_sync ON public.reading_progress(user_id, updated_at);

-- User book downloads (offline tracking)
CREATE TABLE public.user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

    -- Download metadata
    downloaded_chapters INTEGER[] DEFAULT '{}',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    storage_size_bytes BIGINT DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, book_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = 'user');

-- Books policies (public read for published)
CREATE POLICY "Anyone can view published books"
    ON public.books FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Admins can manage all books"
    ON public.books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Chapters policies
-- Allow anyone to view chapter metadata for all chapters of published books
-- (Content access control is handled at the reader/API level)
CREATE POLICY "Anyone can view chapters of published books"
    ON public.chapters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.books b
            WHERE b.id = book_id
            AND b.is_published = TRUE
        )
    );


CREATE POLICY "Admins can manage chapters"
    ON public.chapters FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Purchases policies
CREATE POLICY "Users can view own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
    ON public.purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update purchases"
    ON public.purchases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Reading progress policies
CREATE POLICY "Users can manage own progress"
    ON public.reading_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User downloads policies
CREATE POLICY "Users can manage own downloads"
    ON public.user_downloads FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- OTP codes (service role only - no direct access)
CREATE POLICY "No direct access to OTP codes"
    ON public.otp_codes FOR ALL
    USING (FALSE);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON public.reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update book chapter count
CREATE OR REPLACE FUNCTION update_book_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE public.books
        SET total_chapters = (
            SELECT COUNT(*) FROM public.chapters
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
        )
        WHERE id = COALESCE(NEW.book_id, OLD.book_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chapter_count
    AFTER INSERT OR DELETE ON public.chapters
    FOR EACH ROW EXECUTE FUNCTION update_book_chapter_count();

-- Function to check if user has access to book
CREATE OR REPLACE FUNCTION user_has_book_access(
    p_user_id UUID,
    p_book_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.books WHERE id = p_book_id AND is_free = TRUE
    ) OR EXISTS (
        SELECT 1 FROM public.purchases
        WHERE user_id = p_user_id
        AND book_id = p_book_id
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user library with progress
CREATE OR REPLACE FUNCTION get_user_library(p_user_id UUID)
RETURNS TABLE (
    book_id UUID,
    title_en VARCHAR,
    title_si VARCHAR,
    cover_image_url TEXT,
    total_chapters INTEGER,
    current_chapter INTEGER,
    scroll_position DECIMAL,
    last_read_at TIMESTAMPTZ,
    is_downloaded BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.title_en,
        b.title_si,
        b.cover_image_url,
        b.total_chapters,
        c.chapter_number,
        rp.scroll_position,
        rp.last_read_at,
        ud.id IS NOT NULL as is_downloaded
    FROM public.books b
    LEFT JOIN public.reading_progress rp ON rp.book_id = b.id AND rp.user_id = p_user_id
    LEFT JOIN public.chapters c ON c.id = rp.chapter_id
    LEFT JOIN public.user_downloads ud ON ud.book_id = b.id AND ud.user_id = p_user_id
    WHERE user_has_book_access(p_user_id, b.id)
    ORDER BY rp.last_read_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired OTP codes (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_codes
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
