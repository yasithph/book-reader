export type UserRole = "user" | "admin";
export type PurchaseStatus = "pending" | "approved" | "rejected";
export type LanguagePreference = "en" | "si";
export type ReaderTheme = "light" | "dark" | "sepia";

export interface User {
  id: string;
  phone: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  language_preference: LanguagePreference;
  is_first_login: boolean;
  reader_theme: ReaderTheme;
  font_size: number;
  line_spacing: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface ReadingStats {
  totalCompletedChapters: number;
  totalCompletedBooks: number;
}

export interface Book {
  id: string;
  title_en: string;
  title_si: string;
  description_en: string | null;
  description_si: string | null;
  author_en: string;
  author_si: string;
  cover_image_url: string | null;
  price_lkr: number;
  is_free: boolean;
  free_preview_chapters: number;
  is_published: boolean;
  published_at: string | null;
  total_chapters: number;
  total_words: number;
  created_at: string;
  updated_at: string;
  intro_disclaimer: string | null;
  intro_copyright: string | null;
  intro_thank_you: string | null;
  intro_offering: string | null;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title_en: string | null;
  title_si: string | null;
  content: string;
  draft_content?: string | null;  // Only present in admin context
  is_published?: boolean;          // Only present in admin context
  chapter_image_url?: string | null;
  word_count: number;
  estimated_reading_time: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  book_id: string;
  bundle_id: string | null;
  purchase_group_id: string | null;
  amount_lkr: number;
  payment_reference: string | null;
  payment_proof_url: string | null;
  status: PurchaseStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  description_en: string | null;
  description_si: string | null;
  price_lkr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BundleBook {
  id: string;
  bundle_id: string;
  book_id: string;
  created_at: string;
}

export interface BundleWithBooks extends Bundle {
  books: Book[];
  original_price: number;
  savings: number;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  scroll_position: number;
  last_read_at: string;
  is_chapter_complete: boolean;
  completed_chapters: number[];
  created_at: string;
  updated_at: string;
  client_updated_at: string | null;
}

export interface UserLibraryBook {
  book_id: string;
  title_en: string;
  title_si: string;
  cover_image_url: string | null;
  total_chapters: number;
  current_chapter: number | null;
  scroll_position: number | null;
  last_read_at: string | null;
  is_downloaded: boolean;
}

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number;
  lineSpacing: number;
}

export interface OfflineChapter {
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  content: string;
  chapterImageUrl?: string | null;
  downloadedAt: Date;
  size: number;
}

export interface OfflineBook {
  id: string;
  title_en: string;
  title_si: string;
  author_en: string;
  author_si: string;
  coverImageBlob: Blob | null;
  totalChapters: number;
  downloadedChapters: number[];
  downloadedAt: Date;
  lastAccessedAt: Date;
}

export interface ProgressUpdate {
  id?: number;
  bookId: string;
  chapterId: string;
  scrollPosition: number;
  timestamp: Date;
  synced: boolean;
}

// Social features
export interface ChapterLike {
  id: string;
  user_id: string;
  chapter_id: string;
  created_at: string;
}

export interface ChapterComment {
  id: string;
  chapter_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentWithAuthor {
  id: string;
  chapter_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
  };
  hearts_count: number;
  user_has_hearted: boolean;
  replies: CommentWithAuthor[];
}

export interface ChapterSocialData {
  likes_count: number;
  user_has_liked: boolean;
  comments_count: number;
}
