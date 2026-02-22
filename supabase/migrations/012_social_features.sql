-- Social features: chapter likes, comments, and comment likes

-- Chapter likes (one per user per chapter)
CREATE TABLE chapter_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_chapter_likes_chapter_id ON chapter_likes(chapter_id);
CREATE INDEX idx_chapter_likes_user_id ON chapter_likes(user_id);

-- Chapter comments (supports 1-level threading via parent_id)
CREATE TABLE chapter_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chapter_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chapter_comments_content_check CHECK (is_deleted = true OR char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapter_comments_chapter_created ON chapter_comments(chapter_id, created_at DESC);
CREATE INDEX idx_chapter_comments_parent_id ON chapter_comments(parent_id);
CREATE INDEX idx_chapter_comments_user_id ON chapter_comments(user_id);

-- Auto-update updated_at on comments
CREATE TRIGGER update_chapter_comments_updated_at
  BEFORE UPDATE ON chapter_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comment likes (heart reactions)
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES chapter_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Enable RLS on all tables
ALTER TABLE chapter_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
