-- Create the global_chats table
CREATE TABLE global_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name TEXT, -- Fallback for users who aren't logged in (if allowed)
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE global_chats ENABLE ROW LEVEL SECURITY;

-- Everyone can view chats
CREATE POLICY "Chats are viewable by everyone." 
ON global_chats FOR SELECT 
USING (true);

-- Authenticated users can insert their own chats
CREATE POLICY "Authenticated users can insert chats." 
ON global_chats FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- Optional: If guests are allowed to insert, uncomment below (but usually we only want authenticated users or handle guests differently)
-- CREATE POLICY "Guests can insert chats." 
-- ON global_chats FOR INSERT 
-- WITH CHECK (profile_id IS NULL AND guest_name IS NOT NULL);

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE global_chats;
