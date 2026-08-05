-- Migration: Create all required tables for Campus Hub

-- 1. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  posted_by VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notices Table
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  posted_by VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Marketplace Table
CREATE TABLE IF NOT EXISTS marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  seller VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Animal Welfare Table
CREATE TABLE IF NOT EXISTS animal_welfare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  urgency VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Faculty Suggestions Table
CREATE TABLE IF NOT EXISTS faculty_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Blood Donation Table
CREATE TABLE IF NOT EXISTS blood_donation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  blood_type VARCHAR(10) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  available_date DATE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bicycles Table
CREATE TABLE IF NOT EXISTS bicycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  description TEXT,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Lost and Found Table
CREATE TABLE IF NOT EXISTS lost_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'lost',
  location VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_user_id ON notices(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_user_id ON marketplace(user_id);
CREATE INDEX IF NOT EXISTS idx_animal_welfare_user_id ON animal_welfare(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_suggestions_user_id ON faculty_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_donation_user_id ON blood_donation(user_id);
CREATE INDEX IF NOT EXISTS idx_bicycles_user_id ON bicycles(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_user_id ON lost_found(user_id);

-- Set up RLS (Row Level Security) - Allow all reads and writes for now
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_welfare ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_donation ENABLE ROW LEVEL SECURITY;
ALTER TABLE bicycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Enable read access for all users" ON complaints FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON complaints FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON complaints FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON notices FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON notices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON notices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON notices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON marketplace FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON marketplace FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON marketplace FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON marketplace FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON animal_welfare FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON animal_welfare FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON animal_welfare FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON animal_welfare FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON faculty_suggestions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON faculty_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON faculty_suggestions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON faculty_suggestions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON blood_donation FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON blood_donation FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON blood_donation FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON blood_donation FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bicycles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON bicycles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON bicycles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON bicycles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON lost_found FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON lost_found FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON lost_found FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON lost_found FOR DELETE USING (true);
