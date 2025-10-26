-- Step 1: Add the 'group_id' column to 'chat_messages' table if it doesn't already exist.
-- This column will be used to link messages to a specific work group.
ALTER TABLE "public"."chat_messages" ADD COLUMN IF NOT EXISTS "group_id" uuid;

-- Step 2: Drop the foreign key constraint if it exists, to prevent errors on re-run.
ALTER TABLE "public"."chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_group_id_fkey";

-- Step 3: Add a foreign key constraint to link 'group_id' to the 'work_groups' table.
-- This ensures data integrity, so a message can only belong to a valid work group.
-- ON DELETE CASCADE means if a work group is deleted, its messages are also deleted.
ALTER TABLE "public"."chat_messages" 
ADD CONSTRAINT "chat_messages_group_id_fkey" 
FOREIGN KEY (group_id) 
REFERENCES work_groups(id) 
ON DELETE CASCADE;