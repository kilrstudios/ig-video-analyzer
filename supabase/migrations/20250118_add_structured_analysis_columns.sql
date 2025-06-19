-- Add structured analysis columns to video_analyses table
-- This migration adds dedicated columns for different types of analysis data

-- Add new columns for structured analysis data
ALTER TABLE video_analyses 
ADD COLUMN IF NOT EXISTS content_analysis JSONB,
ADD COLUMN IF NOT EXISTS scene_analysis JSONB,
ADD COLUMN IF NOT EXISTS hook_analysis JSONB,
ADD COLUMN IF NOT EXISTS transcript_data JSONB,
ADD COLUMN IF NOT EXISTS video_metadata JSONB,
ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT '2.0';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id_created_at ON video_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analyses_analysis_version ON video_analyses(analysis_version);

-- Update RLS policies to include new columns
-- (The existing policies already cover the new columns since they're part of the same table)

-- Add comments to document the new column structure
COMMENT ON COLUMN video_analyses.content_analysis IS 'JSONB data containing creator strategy, narrative structure, and contextual analysis';
COMMENT ON COLUMN video_analyses.scene_analysis IS 'JSONB array containing detailed scene-by-scene breakdown';
COMMENT ON COLUMN video_analyses.hook_analysis IS 'JSONB array containing hook analysis and attention-grabbing elements';
COMMENT ON COLUMN video_analyses.transcript_data IS 'JSONB object containing transcript text and segments';
COMMENT ON COLUMN video_analyses.video_metadata IS 'JSONB object containing video metadata like duration, frames, etc.';
COMMENT ON COLUMN video_analyses.analysis_version IS 'Version identifier for analysis format compatibility';

-- Create a function to migrate existing analysis_data to new structured format
CREATE OR REPLACE FUNCTION migrate_existing_analysis_data()
RETURNS INTEGER AS $$
DECLARE
  analysis_record RECORD;
  migrated_count INTEGER := 0;
BEGIN
  -- Loop through all existing analyses that haven't been migrated
  FOR analysis_record IN 
    SELECT id, analysis_data 
    FROM video_analyses 
    WHERE analysis_version IS NULL OR analysis_version = '1.0'
  LOOP
    BEGIN
      -- Extract and migrate data from the old analysis_data JSONB
      UPDATE video_analyses 
      SET 
        content_analysis = CASE 
          WHEN analysis_data ? 'strategicOverview' THEN analysis_data->'strategicOverview'
          WHEN analysis_data ? 'contextualAnalysis' THEN analysis_data->'contextualAnalysis'
          ELSE NULL
        END,
        scene_analysis = CASE 
          WHEN analysis_data ? 'scenes' THEN analysis_data->'scenes'
          ELSE NULL
        END,
        hook_analysis = CASE 
          WHEN analysis_data ? 'hooks' THEN analysis_data->'hooks'
          ELSE NULL
        END,
        transcript_data = CASE 
          WHEN analysis_data ? 'transcript' THEN analysis_data->'transcript'
          ELSE NULL
        END,
        video_metadata = jsonb_build_object(
          'totalDuration', analysis_data->>'totalDuration',
          'videoMetadata', analysis_data->'videoMetadata',
          'videoCategory', analysis_data->'videoCategory'
        ),
        analysis_version = '2.0',
        updated_at = NOW()
      WHERE id = analysis_record.id;
      
      migrated_count := migrated_count + 1;
      
    EXCEPTION
      WHEN others THEN
        -- Log error but continue with other records
        RAISE WARNING 'Failed to migrate analysis record %: %', analysis_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_existing_analysis_data() as migrated_records;

-- Create helper function to insert structured analysis
CREATE OR REPLACE FUNCTION insert_structured_analysis(
  p_user_id UUID,
  p_video_url TEXT,
  p_credits_used INTEGER,
  p_content_analysis JSONB DEFAULT NULL,
  p_scene_analysis JSONB DEFAULT NULL,
  p_hook_analysis JSONB DEFAULT NULL,
  p_transcript_data JSONB DEFAULT NULL,
  p_video_metadata JSONB DEFAULT NULL,
  p_legacy_analysis_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_analysis_id UUID;
BEGIN
  INSERT INTO video_analyses (
    user_id,
    video_url,
    credits_used,
    content_analysis,
    scene_analysis,
    hook_analysis,
    transcript_data,
    video_metadata,
    analysis_data, -- Keep for backward compatibility
    analysis_version,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_video_url,
    p_credits_used,
    p_content_analysis,
    p_scene_analysis,
    p_hook_analysis,
    p_transcript_data,
    p_video_metadata,
    COALESCE(p_legacy_analysis_data, '{}'),
    '2.0',
    'completed',
    NOW(),
    NOW()
  ) RETURNING id INTO new_analysis_id;
  
  RETURN new_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION insert_structured_analysis TO authenticated, anon; 