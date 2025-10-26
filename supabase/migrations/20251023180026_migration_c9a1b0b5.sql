-- Fix the broar table to allow automatic ID generation
-- Drop the existing NOT NULL constraint and add a DEFAULT value

ALTER TABLE broar 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();