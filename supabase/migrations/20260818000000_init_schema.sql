-- Bingo Arena Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance BIGINT DEFAULT 10000 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wallet Transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL, -- positive for credit, negative for debit
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bingo Rooms
CREATE TABLE bingo_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  entry_fee BIGINT NOT NULL,
  max_players INT NOT NULL DEFAULT 50,
  prize_pool BIGINT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bingo Games
CREATE TABLE bingo_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES bingo_rooms(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'STARTING', 'IN_PROGRESS', 'WINNER_PENDING', 'COMPLETED')),
  winning_pattern TEXT DEFAULT 'ANY', -- e.g., 'HORIZONTAL', 'FULL_CARD', 'ANY'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bingo Game Players
CREATE TABLE bingo_game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES bingo_games(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, profile_id)
);

-- 7. Bingo Cards
CREATE TABLE bingo_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES bingo_games(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  numbers JSONB NOT NULL, -- stores the 5x5 grid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bingo Draws
CREATE TABLE bingo_draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES bingo_games(id) ON DELETE CASCADE NOT NULL,
  number INT NOT NULL CHECK (number >= 1 AND number <= 75),
  drawn_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, number)
);

-- 9. Bingo Winners
CREATE TABLE bingo_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES bingo_games(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES bingo_cards(id) ON DELETE CASCADE NOT NULL,
  pattern TEXT NOT NULL,
  prize_amount BIGINT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id) -- Only one winner per game for this prototype
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setup RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be refined later)
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallet." ON wallets FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own transactions." ON wallet_transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM wallets WHERE profile_id = auth.uid())
);

CREATE POLICY "Rooms are viewable by everyone." ON bingo_rooms FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Games are viewable by everyone." ON bingo_games FOR SELECT USING (true);
CREATE POLICY "Players can view game players." ON bingo_game_players FOR SELECT USING (true);

CREATE POLICY "Users can view own cards." ON bingo_cards FOR SELECT USING (auth.uid() = profile_id);
-- Allow viewing all cards of a completed game, or just own cards. For now, own cards.

CREATE POLICY "Draws are viewable by everyone." ON bingo_draws FOR SELECT USING (true);
CREATE POLICY "Winners are viewable by everyone." ON bingo_winners FOR SELECT USING (true);

-- End of schema
