-- Add optional staff profile image URL for the account center.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD CONSTRAINT users_avatar_url_length CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500);
