-- enable uuid generator (safe even if already installed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub        text UNIQUE NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. add owner_id to folders/sets/flashcards
ALTER TABLE folders    ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE sets       ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 3. foreign keys
ALTER TABLE folders
  DROP CONSTRAINT IF EXISTS folders_owner_id_fkey;
ALTER TABLE folders
  ADD CONSTRAINT folders_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sets
  DROP CONSTRAINT IF EXISTS sets_owner_id_fkey;
ALTER TABLE sets
  ADD CONSTRAINT sets_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE flashcards
  DROP CONSTRAINT IF EXISTS flashcards_owner_id_fkey;
ALTER TABLE flashcards
  ADD CONSTRAINT flashcards_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. indexes
CREATE INDEX IF NOT EXISTS idx_folders_owner    ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_sets_owner       ON sets(owner_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_owner ON flashcards(owner_id);