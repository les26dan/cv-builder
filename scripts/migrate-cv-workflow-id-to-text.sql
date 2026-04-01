-- Migrate cv_workflow.id from UUID to TEXT to support template IDs
-- This allows both UUID and custom IDs like 'template-1234567890'

BEGIN;

-- Step 1: Create a new column with TEXT type
ALTER TABLE cv_workflow ADD COLUMN id_new TEXT;

-- Step 2: Copy existing UUIDs to the new column (cast to text)
UPDATE cv_workflow SET id_new = id::text;

-- Step 3: Drop the old UUID column
ALTER TABLE cv_workflow DROP COLUMN id;

-- Step 4: Rename the new column to id
ALTER TABLE cv_workflow RENAME COLUMN id_new TO id;

-- Step 5: Add PRIMARY KEY constraint
ALTER TABLE cv_workflow ADD PRIMARY KEY (id);

-- Step 6: Recreate indexes if needed
DROP INDEX IF EXISTS idx_cv_workflow_user_id;
CREATE INDEX idx_cv_workflow_user_id ON cv_workflow(user_id);

COMMIT;

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cv_workflow' AND column_name = 'id';
