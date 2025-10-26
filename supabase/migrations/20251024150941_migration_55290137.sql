-- Step 1: Drop the view that's blocking the column modification
DROP VIEW IF EXISTS jobs;

-- Step 2: Clean up orphaned data (jobs referencing non-existent bridges)
-- First, set NULL for any bro_id that doesn't exist in bridges table
UPDATE jobb 
SET bro_id = NULL 
WHERE bro_id IS NOT NULL 
  AND bro_id NOT IN (SELECT id::text FROM bridges);

-- Step 3: Now safely change the column type from TEXT to UUID
-- Using a safe USING clause that handles both NULL and valid UUID strings
ALTER TABLE jobb 
  ALTER COLUMN bro_id TYPE uuid 
  USING CASE 
    WHEN bro_id IS NULL THEN NULL
    WHEN bro_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN bro_id::uuid
    ELSE NULL
  END;

-- Step 4: Add the foreign key constraint
ALTER TABLE jobb 
  ADD CONSTRAINT jobb_bro_id_fkey 
  FOREIGN KEY (bro_id) 
  REFERENCES bridges(id) 
  ON DELETE SET NULL;

-- Step 5: Recreate the jobs view for backward compatibility
CREATE OR REPLACE VIEW jobs AS
SELECT 
  j.id,
  j.bro_id as bridge_id,
  j.ansvarig_anvandare as user_id,
  j.start_tid as start_time,
  j.slut_tid as end_time,
  j.anteckningar as description,
  j.status,
  j.bilder as photos,
  j.created_at,
  j.updated_at
FROM jobb j;