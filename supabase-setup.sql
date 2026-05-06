-- Supabase SQL Setup for SME24-7

-- 1. Site Settings Table
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT,
  business_address TEXT,
  business_maps_link TEXT,
  business_logo TEXT,
  taxi_fare INTEGER DEFAULT 0,
  taxi_fare_currency TEXT DEFAULT 'PHP',
  taxi_fare_notes TEXT,
  service_1_name TEXT DEFAULT 'Whole Body Massage',
  service_1_price INTEGER DEFAULT 0,
  service_2_name TEXT DEFAULT 'Sensual Massage',
  service_2_price INTEGER DEFAULT 0,
  viber TEXT,
  wechat TEXT,
  kakaotalk TEXT,
  telegram TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Therapists Table
CREATE TABLE therapists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  location TEXT,
  bio TEXT,
  rate INTEGER,
  specialties TEXT[] DEFAULT '{}',
  pricing JSONB,
  featured BOOLEAN DEFAULT FALSE,
  image TEXT,
  slides TEXT[] DEFAULT '{}',
  map_url TEXT,
  availability TEXT DEFAULT '24 hours',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Therapist Drafts Table (for admin uploads)
CREATE TABLE therapist_drafts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  vital_statistics TEXT,
  address TEXT,
  profile_picture TEXT,
  slides TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Public Therapist Directory
CREATE POLICY "Public can read therapists" ON therapists
  FOR SELECT USING (true);

-- RLS Policies for Site Settings (admin only)
CREATE POLICY "Authenticated admins can read settings" ON site_settings
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Authenticated admins can update settings" ON site_settings
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- RLS Policies for Therapist Drafts (admin only)
CREATE POLICY "Authenticated admins can read drafts" ON therapist_drafts
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Authenticated admins can insert drafts" ON therapist_drafts
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Authenticated admins can delete drafts" ON therapist_drafts
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );
