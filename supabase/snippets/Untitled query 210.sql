-- Top Readers badge system: cache table + refresh function

DROP TABLE IF EXISTS top_readers;
DROP FUNCTION IF EXISTS refresh_top_readers;

CREATE TABLE top_readers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  chapters_completed INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  chapter_likes_count INTEGER NOT NULL DEFAULT 0,
  comment_likes_count INTEGER NOT NULL DEFAULT 0,
  comment_likes_received_count INTEGER NOT NULL DEFAULT 0,
  badge_notified BOOLEAN NOT NULL DEFAULT FALSE,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_top_readers_rank ON top_readers(rank);

-- RLS: anyone can read (badge visibility), no public writes
ALTER TABLE top_readers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "top_readers_select" ON top_readers
  FOR SELECT USING (true);

-- Refresh function (SECURITY DEFINER so it can bypass RLS)
CREATE OR REPLACE FUNCTION refresh_top_readers(top_n INTEGER DEFAULT 20)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Save badge_notified status for users who already dismissed the popup
  CREATE TEMP TABLE _old_badge_status ON COMMIT DROP AS
    SELECT user_id FROM top_readers WHERE badge_notified = TRUE;

  -- Clear the table
  TRUNCATE top_readers;

  -- Insert top N users with calculated scores
  INSERT INTO top_readers (user_id, engagement_score, rank, chapters_completed, comments_count, chapter_likes_count, comment_likes_count, comment_likes_received_count, refreshed_at)
  SELECT
    user_id,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) AS rank,
    chapters_completed_count,
    comments_count,
    comment_likes_count,
    chapter_likes_count,
    comment_likes_received_count,
    now()
  FROM (
    SELECT
      u.id AS user_id,
      COALESCE(rp.chapters_completed_count, 0) * 10
        + COALESCE(cc.comments_count, 0) * 20
        + COALESCE(cl.comment_likes_count, 0) * 3
        + COALESCE(chl.chapter_likes_count, 0) * 1
        + COALESCE(clr.comment_likes_received_count, 0) * 5 AS score,
      COALESCE(rp.chapters_completed_count, 0)::INTEGER AS chapters_completed_count,
      COALESCE(cc.comments_count, 0)::INTEGER AS comments_count,
      COALESCE(cl.comment_likes_count, 0)::INTEGER AS comment_likes_count,
      COALESCE(chl.chapter_likes_count, 0)::INTEGER AS chapter_likes_count,
      COALESCE(clr.comment_likes_received_count, 0)::INTEGER AS comment_likes_received_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, SUM(array_length(completed_chapters, 1)) AS chapters_completed_count
      FROM reading_progress
      WHERE completed_chapters IS NOT NULL AND array_length(completed_chapters, 1) > 0
      GROUP BY user_id
    ) rp ON rp.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS comments_count
      FROM chapter_comments
      WHERE is_deleted = false
      GROUP BY user_id
    ) cc ON cc.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS comment_likes_count
      FROM comment_likes
      GROUP BY user_id
    ) cl ON cl.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS chapter_likes_count
      FROM chapter_likes
      GROUP BY user_id
    ) chl ON chl.user_id = u.id
    LEFT JOIN (
      SELECT c.user_id, COUNT(*) AS comment_likes_received_count
      FROM comment_likes lk
      JOIN chapter_comments c ON c.id = lk.comment_id
      WHERE c.is_deleted = false
      GROUP BY c.user_id
    ) clr ON clr.user_id = u.id
    WHERE u.role = 'user'
      AND (
        COALESCE(rp.chapters_completed_count, 0) * 10
        + COALESCE(cc.comments_count, 0) * 20
        + COALESCE(cl.comment_likes_count, 0) * 3
        + COALESCE(chl.chapter_likes_count, 0) * 1
        + COALESCE(clr.comment_likes_received_count, 0) * 5
      ) > 0
    ORDER BY score DESC
    LIMIT top_n
  ) ranked;

  -- Restore badge_notified for users who remain on the leaderboard
  UPDATE top_readers t
  SET badge_notified = TRUE
  FROM _old_badge_status o
  WHERE t.user_id = o.user_id;
END;
$$;
