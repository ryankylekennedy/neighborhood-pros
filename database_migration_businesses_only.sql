-- Database Migration: Convert to Businesses Only
-- Run this in Supabase Dashboard -> SQL Editor

-- Step 1: Drop the professional_favorites table we just created (not needed)
DROP TABLE IF EXISTS professional_favorites CASCADE;

-- Step 2: Update recommendations table to use business_id instead of professional_id
-- First, backup any existing recommendations (optional but recommended)
-- CREATE TABLE recommendations_backup AS SELECT * FROM recommendations;

-- Drop existing recommendations table and recreate with business_id
DROP TABLE IF EXISTS recommendations CASCADE;

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Ensure user can't recommend same business twice
  UNIQUE(user_id, business_id)
);

-- Add indexes for performance
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_business_id ON recommendations(business_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Anyone can view recommendations"
  ON recommendations
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own recommendations"
  ON recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
  ON recommendations
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON recommendations
  FOR UPDATE
  USING (auth.uid() = user_id);
