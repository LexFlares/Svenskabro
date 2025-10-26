-- PHASE 1 CONTINUED: Add missing database indexes for performance

-- Deviations indexes
CREATE INDEX IF NOT EXISTS idx_deviations_bridge_id ON deviations(bridge_id);
CREATE INDEX IF NOT EXISTS idx_deviations_user_id ON deviations(user_id);
CREATE INDEX IF NOT EXISTS idx_deviations_status ON deviations(status);
CREATE INDEX IF NOT EXISTS idx_deviations_created_at ON deviations(created_at);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Work groups indexes
CREATE INDEX IF NOT EXISTS idx_work_groups_created_by ON work_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_work_groups_invite_code ON work_groups(invite_code);

-- Messages indexes (additional)
CREATE INDEX IF NOT EXISTS idx_messages_delivered ON messages(delivered);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Chat messages indexes (additional)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);