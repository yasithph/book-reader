-- =============================================
-- BUNDLES SYSTEM
-- Allows creating book bundles with discounted pricing
-- =============================================

-- Bundles table
CREATE TABLE public.bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Bundle info
    name_en VARCHAR(200) NOT NULL,
    name_si VARCHAR(200),
    description_en TEXT,
    description_si TEXT,

    -- Pricing
    price_lkr DECIMAL(10,2) NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Junction table for bundle <-> books (many-to-many)
CREATE TABLE public.bundle_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure a book can only be in a bundle once
    UNIQUE(bundle_id, book_id)
);

-- Add bundle_id to purchases table
-- When a bundle is purchased, we create one purchase record per book in the bundle
-- All records share the same bundle_id to group them
ALTER TABLE public.purchases
ADD COLUMN bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL;

-- Add purchase_group_id to link multiple purchase records from same transaction
-- This helps identify all books purchased together (whether bundle or multi-book purchase)
ALTER TABLE public.purchases
ADD COLUMN purchase_group_id UUID;

-- Indexes
CREATE INDEX idx_bundles_active ON public.bundles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_bundle_books_bundle ON public.bundle_books(bundle_id);
CREATE INDEX idx_bundle_books_book ON public.bundle_books(book_id);
CREATE INDEX idx_purchases_bundle ON public.purchases(bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX idx_purchases_group ON public.purchases(purchase_group_id) WHERE purchase_group_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_books ENABLE ROW LEVEL SECURITY;

-- Bundles policies (public read for active, admin manage)
CREATE POLICY "Anyone can view active bundles"
    ON public.bundles FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage all bundles"
    ON public.bundles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Bundle books policies (public read, admin manage)
CREATE POLICY "Anyone can view bundle contents"
    ON public.bundle_books FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bundles
            WHERE id = bundle_id AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can manage bundle contents"
    ON public.bundle_books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to update bundles.updated_at
CREATE TRIGGER update_bundles_updated_at
    BEFORE UPDATE ON public.bundles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate bundle savings (original price - bundle price)
CREATE OR REPLACE FUNCTION get_bundle_savings(p_bundle_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_original_price DECIMAL;
    v_bundle_price DECIMAL;
BEGIN
    -- Get sum of individual book prices
    SELECT COALESCE(SUM(b.price_lkr), 0)
    INTO v_original_price
    FROM public.bundle_books bb
    JOIN public.books b ON b.id = bb.book_id
    WHERE bb.bundle_id = p_bundle_id;

    -- Get bundle price
    SELECT price_lkr
    INTO v_bundle_price
    FROM public.bundles
    WHERE id = p_bundle_id;

    RETURN v_original_price - v_bundle_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get bundle details with books and savings
CREATE OR REPLACE FUNCTION get_bundle_with_books(p_bundle_id UUID)
RETURNS TABLE (
    bundle_id UUID,
    name_en VARCHAR,
    name_si VARCHAR,
    description_en TEXT,
    description_si TEXT,
    price_lkr DECIMAL,
    original_price DECIMAL,
    savings DECIMAL,
    book_count BIGINT,
    books JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bu.id as bundle_id,
        bu.name_en,
        bu.name_si,
        bu.description_en,
        bu.description_si,
        bu.price_lkr,
        COALESCE(SUM(b.price_lkr), 0) as original_price,
        COALESCE(SUM(b.price_lkr), 0) - bu.price_lkr as savings,
        COUNT(bb.id) as book_count,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', b.id,
                'title_en', b.title_en,
                'title_si', b.title_si,
                'cover_image_url', b.cover_image_url,
                'price_lkr', b.price_lkr
            )
        ) as books
    FROM public.bundles bu
    LEFT JOIN public.bundle_books bb ON bb.bundle_id = bu.id
    LEFT JOIN public.books b ON b.id = bb.book_id
    WHERE bu.id = p_bundle_id
    GROUP BY bu.id, bu.name_en, bu.name_si, bu.description_en, bu.description_si, bu.price_lkr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to all books in a bundle
CREATE OR REPLACE FUNCTION user_has_bundle_access(p_user_id UUID, p_bundle_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has approved purchases for ALL books in the bundle
    RETURN NOT EXISTS (
        SELECT 1 FROM public.bundle_books bb
        WHERE bb.bundle_id = p_bundle_id
        AND NOT EXISTS (
            SELECT 1 FROM public.purchases p
            WHERE p.user_id = p_user_id
            AND p.book_id = bb.book_id
            AND p.status = 'approved'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
