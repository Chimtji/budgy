-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  icon VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create segments table (now independent, can be shared across categories)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS category_segments (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, segment_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_category_segments_category_id ON category_segments(category_id);
CREATE INDEX IF NOT EXISTS idx_category_segments_segment_id ON category_segments(segment_id);
