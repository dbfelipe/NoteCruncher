CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) UNIQUE,
    video_url TEXT,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster video_id lookups
CREATE INDEX IF NOT EXISTS idx_video_id ON summaries (video_id);