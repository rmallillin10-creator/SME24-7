-- Supabase SQL Setup for SME24-7

-- 1. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT,
  business_address TEXT,
  business_maps_link TEXT,
  business_logo TEXT,
  business_service_type TEXT,
  business_service_area TEXT,
  business_google_rating TEXT DEFAULT '5.0',
  business_google_review_count TEXT,
  business_google_rating_label TEXT DEFAULT 'Google Maps rating',
  taxi_fare INTEGER DEFAULT 0,
  taxi_fare_currency TEXT DEFAULT 'PHP',
  taxi_fare_notes TEXT,
  google_sheets_web_app_url TEXT,
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
CREATE TABLE IF NOT EXISTS therapists (
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
  images TEXT[] DEFAULT '{}',
  map_url TEXT,
  availability TEXT DEFAULT '24 hours',
  booking_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  fullname TEXT,
  mobile_number TEXT,
  preferred_service TEXT,
  preferred_date DATE,
  preferred_time TIME,
  preferred_female_therapist TEXT,
  female_therapist_count INTEGER DEFAULT 0,
  preferred_female_therapist_name TEXT,
  preferred_male_therapist TEXT,
  male_therapist_count INTEGER DEFAULT 0,
  preferred_male_therapist_name TEXT,
  location TEXT,
  landmark TEXT,
  estimated_service_cost TEXT,
  taxi_fare TEXT,
  total_estimate TEXT,
  special_requests TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  booking_status TEXT DEFAULT 'Pending',
  source TEXT DEFAULT 'Website Booking',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Therapist Drafts Table (for admin uploads)
CREATE TABLE IF NOT EXISTS therapist_drafts (
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

-- 5. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_service_type TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_service_area TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_google_rating TEXT DEFAULT '5.0';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_google_review_count TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS business_google_rating_label TEXT DEFAULT 'Google Maps rating';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_sheets_web_app_url TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS booking_count INTEGER DEFAULT 0;

DROP POLICY IF EXISTS "Public can read therapists" ON therapists;
DROP POLICY IF EXISTS "Public can read settings" ON site_settings;
DROP POLICY IF EXISTS "Public can insert settings" ON site_settings;
DROP POLICY IF EXISTS "Public can update settings" ON site_settings;
DROP POLICY IF EXISTS "Public can insert therapists" ON therapists;
DROP POLICY IF EXISTS "Public can update therapists" ON therapists;
DROP POLICY IF EXISTS "Public can delete therapists" ON therapists;
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated admins can read bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated admins can read drafts" ON therapist_drafts;
DROP POLICY IF EXISTS "Authenticated admins can insert drafts" ON therapist_drafts;
DROP POLICY IF EXISTS "Authenticated admins can delete drafts" ON therapist_drafts;

-- RLS Policies for Public Therapist Directory
CREATE POLICY "Public can read therapists" ON therapists
  FOR SELECT USING (true);

CREATE POLICY "Public can read settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert settings" ON site_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update settings" ON site_settings
  FOR UPDATE USING (true);

CREATE POLICY "Public can insert therapists" ON therapists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update therapists" ON therapists
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete therapists" ON therapists
  FOR DELETE USING (true);

CREATE POLICY "Public can insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated admins can read bookings" ON bookings
  FOR SELECT USING (
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
