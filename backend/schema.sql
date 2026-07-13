-- ═══════════════════════════════════════════════════════════════════════════════
-- DarshanEase — PostgreSQL Schema
-- Run: psql -U postgres -d darshanease -f schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  password_hash TEXT,
  avatar_url    TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OTP codes (short-lived, for phone verification) ─────────────────────────

CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes (phone);

-- ─── Temples ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS temples (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT NOT NULL,
  state        TEXT NOT NULL,
  deity        TEXT NOT NULL,
  religion     TEXT NOT NULL CHECK (religion IN ('Hindu','Sikh','Jain','Buddhist')),
  rating       NUMERIC(2,1) DEFAULT 4.5,
  reviews      INT DEFAULT 0,
  image_url    TEXT,
  description  TEXT,
  established  TEXT,
  open_hours   TEXT,
  featured     BOOLEAN DEFAULT FALSE,
  facilities   TEXT[] DEFAULT '{}',
  next_slot    TEXT,
  tickets_left INT DEFAULT 500,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pooja types per temple ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS poojas (
  id          SERIAL PRIMARY KEY,
  temple_id   INT REFERENCES temples(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  duration    TEXT NOT NULL,
  price       INT NOT NULL DEFAULT 0,
  description TEXT,
  popular     BOOLEAN DEFAULT FALSE
);

-- ─── Time slots per temple per date ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS time_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id   INT REFERENCES temples(id) ON DELETE CASCADE,
  slot_date   DATE NOT NULL,
  slot_time   TEXT NOT NULL,
  capacity    INT NOT NULL DEFAULT 60,
  booked      INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (temple_id, slot_date, slot_time)
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  temple_id         INT REFERENCES temples(id),
  pooja_id          INT REFERENCES poojas(id),
  visit_date        DATE NOT NULL,
  time_slot         TEXT NOT NULL,
  num_adults        INT NOT NULL DEFAULT 1,
  num_children      INT NOT NULL DEFAULT 0,
  amount            INT NOT NULL DEFAULT 0,
  gst               INT NOT NULL DEFAULT 0,
  convenience_fee   INT NOT NULL DEFAULT 0,
  total_amount      INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  reference         TEXT UNIQUE NOT NULL,
  payment_method    TEXT,
  family_member_ids UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_temple ON bookings (temple_id);

-- ─── Family members ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS family_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  relation         TEXT NOT NULL,
  age              INT NOT NULL,
  id_type          TEXT NOT NULL,
  id_number_hash   TEXT NOT NULL,  -- store bcrypt hash, never plaintext
  id_number_last4  TEXT NOT NULL,  -- last 4 digits only for display
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_user ON family_members (user_id);

-- ─── Donations ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS donations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  temple_id      INT REFERENCES temples(id),
  cause          TEXT NOT NULL,
  amount         INT NOT NULL,
  payment_method TEXT,
  status         TEXT DEFAULT 'completed' CHECK (status IN ('completed','pending','failed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed: 16 Temples ────────────────────────────────────────────────────────

INSERT INTO temples (name, location, state, deity, religion, rating, reviews, image_url, description, established, open_hours, featured, facilities, next_slot, tickets_left) VALUES
('Tirupati Balaji', 'Tirupati, Andhra Pradesh', 'Andhra Pradesh', 'Lord Venkateswara', 'Hindu', 4.9, 12480, 'https://images.unsplash.com/photo-1566915682737-3e97a7eed93b?w=600&h=400&fit=crop', 'One of the most visited religious sites in the world, Sri Venkateswara Swamy temple sits atop the Tirumala hills.', '300 CE', '2:30 AM – 9:00 PM', TRUE, ARRAY['Prasadam','Locker','Wheelchair','Drinking Water','Annadanam'], 'Today, 6:00 AM', 120),
('Vaishno Devi', 'Katra, Jammu & Kashmir', 'Jammu & Kashmir', 'Goddess Vaishno Devi', 'Hindu', 4.8, 9870, 'https://images.unsplash.com/photo-1737479957329-6eddc445d4df?w=600&h=400&fit=crop', 'Nestled in the Trikuta Mountains at 5,200 ft, Vaishno Devi Shrine draws over 8 million devotees annually.', '700 CE', '24 hours', TRUE, ARRAY['Helicopter Service','Ponies','Battery Cars','Medical Aid','Prasadam'], 'Today, 4:00 AM', 250),
('Siddhivinayak', 'Mumbai, Maharashtra', 'Maharashtra', 'Lord Ganesha', 'Hindu', 4.7, 8340, 'https://images.unsplash.com/photo-1557062975-92aa401cee64?w=600&h=400&fit=crop', 'Mumbai''s most beloved Ganesha temple with a golden dome and intricate woodwork.', '1801 CE', '5:30 AM – 10:00 PM', TRUE, ARRAY['Prasadam','Locker','Online Darshan','Annadanam'], 'Today, 5:30 AM', 80),
('Kashi Vishwanath', 'Varanasi, Uttar Pradesh', 'Uttar Pradesh', 'Lord Shiva', 'Hindu', 4.9, 15200, 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=600&h=400&fit=crop', 'One of the most sacred Jyotirlingas, standing on the western bank of the holy Ganga in Varanasi.', '11th century', '2:30 AM – 11:00 PM', FALSE, ARRAY['Ganga Aarti','Prasadam','Locker','Security'], 'Today, 2:30 AM', 150),
('Meenakshi Amman', 'Madurai, Tamil Nadu', 'Tamil Nadu', 'Goddess Meenakshi', 'Hindu', 4.8, 10650, 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=600&h=400&fit=crop', 'A historic Hindu temple renowned for its awe-inspiring 14 towering gopurams.', '1623 CE', '5:00 AM – 10:00 PM', TRUE, ARRAY['Prasadam','Museum','Elephant Blessing','Annadanam'], 'Today, 5:00 AM', 200),
('Golden Temple', 'Amritsar, Punjab', 'Punjab', 'Waheguru', 'Sikh', 4.9, 18900, 'https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=600&h=400&fit=crop', 'Sri Harmandir Sahib — the holiest Gurdwara of Sikhism. The langar serves 100,000 people daily.', '1604 CE', '24 hours (always open)', TRUE, ARRAY['Langar (Free Meals)','Sarovar Bath','Museum','Library'], 'Open 24/7', 999),
('Jagannath Puri', 'Puri, Odisha', 'Odisha', 'Lord Jagannath', 'Hindu', 4.7, 7890, 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop', 'One of the four sacred dhams of Hinduism, famous for the annual Rath Yatra festival.', '12th century', '5:00 AM – 11:00 PM', FALSE, ARRAY['Prasadam','Mahaprasad','Annadanam'], 'Today, 5:00 AM', 175),
('Somnath Temple', 'Prabhas Patan, Gujarat', 'Gujarat', 'Lord Shiva', 'Hindu', 4.8, 6540, 'https://images.unsplash.com/photo-1529733772151-bab41484710a?w=600&h=400&fit=crop', 'The first among the 12 Jyotirlingas, built on the Saurashtra coast.', 'Ancient', '6:00 AM – 9:00 PM', FALSE, ARRAY['Sound & Light Show','Prasadam','Seaside View'], 'Today, 6:00 AM', 300),
('Ramanathaswamy', 'Rameswaram, Tamil Nadu', 'Tamil Nadu', 'Lord Shiva', 'Hindu', 4.7, 5890, 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?w=600&h=400&fit=crop', 'Located on Pamban Island. The temple has the longest temple corridor in India at 1,212 m.', '12th century', '5:00 AM – 9:00 PM', FALSE, ARRAY['Theertham Bath','Prasadam','Pillar Corridor'], 'Today, 5:00 AM', 220),
('Badrinath Temple', 'Chamoli, Uttarakhand', 'Uttarakhand', 'Lord Vishnu', 'Hindu', 4.9, 8200, 'https://images.unsplash.com/photo-1665003815164-8f5bc853ef44?w=600&h=400&fit=crop', 'Set against the Neelkanth peak in the Garhwal Himalayas at 3,300 m altitude.', '8th century', 'Apr–Nov: 4:30 AM – 9:00 PM', FALSE, ARRAY['Tapt Kund Hot Spring','Prasadam','Helicopter Service'], 'Today, 4:30 AM', 90),
('Kedarnath Temple', 'Rudraprayag, Uttarakhand', 'Uttarakhand', 'Lord Shiva', 'Hindu', 4.9, 9800, 'https://images.unsplash.com/photo-1665003725647-3ae0f01140b1?w=600&h=400&fit=crop', 'Perched at 3,583 m in the Himalayas, one of the 12 Jyotirlingas.', '8th century', 'Apr–Nov: 4:00 AM – 9:00 PM', FALSE, ARRAY['Helicopter Service','Ponies','Palanquins'], 'Today, 4:00 AM', 60),
('Brihadeeswara Temple', 'Thanjavur, Tamil Nadu', 'Tamil Nadu', 'Lord Shiva', 'Hindu', 4.8, 4320, 'https://images.unsplash.com/photo-1632962237468-0705d7e7b534?w=600&h=400&fit=crop', 'A UNESCO World Heritage Site — Chola masterpiece featuring a 66m vimana.', '1010 CE', '6:00 AM – 8:30 PM', FALSE, ARRAY['Museum','Archaeological Survey','Light Show'], 'Today, 6:00 AM', 400),
('Akshardham Delhi', 'New Delhi, Delhi', 'Delhi', 'Lord Swaminarayan', 'Hindu', 4.8, 11200, 'https://images.unsplash.com/photo-1741003411268-2462dd845d26?w=600&h=400&fit=crop', 'A stunning modern Hindu mandir complex spread over 100 acres.', '2005 CE', '10:00 AM – 6:30 PM (Tue–Sun)', FALSE, ARRAY['Musical Fountain','Exhibition Halls','Boat Ride','Garden'], 'Today, 10:00 AM', 500),
('Dilwara Jain Temples', 'Mount Abu, Rajasthan', 'Rajasthan', 'Tirthankara', 'Jain', 4.7, 3450, 'https://images.unsplash.com/photo-1741003411336-eac8fa3e701f?w=600&h=400&fit=crop', 'A group of five marble temples renowned for their stunning intricacy.', '11th–13th century', '7:00 AM – 6:00 PM', FALSE, ARRAY['Guided Tours','Marble Architecture'], 'Today, 7:00 AM', 150),
('Mahabodhi Temple', 'Bodh Gaya, Bihar', 'Bihar', 'Lord Buddha', 'Buddhist', 4.9, 7100, 'https://images.unsplash.com/photo-1557062975-96113e46608b?w=600&h=400&fit=crop', 'UNESCO World Heritage Site — where Siddhartha Gautama attained enlightenment.', '3rd century BCE', '5:00 AM – 9:00 PM', FALSE, ARRAY['Bodhi Tree','Meditation Zones','International Monasteries','Pond'], 'Today, 5:00 AM', 800),
('Shirdi Sai Baba', 'Shirdi, Maharashtra', 'Maharashtra', 'Sai Baba', 'Hindu', 4.8, 13400, 'https://images.unsplash.com/photo-1602772576878-a934c7c6b273?w=600&h=400&fit=crop', 'One of India''s most visited pilgrimage sites, drawing devotees of all faiths.', '1922 CE', '4:00 AM – 11:00 PM', TRUE, ARRAY['Prasadam','Annadanam','Live Darshan','Museum'], 'Today, 4:00 AM', 200)
ON CONFLICT DO NOTHING;

-- ─── Seed: Pooja types (for each temple) ─────────────────────────────────────

INSERT INTO poojas (temple_id, name, duration, price, description, popular)
SELECT t.id, p.name, p.duration, p.price, p.description, p.popular
FROM temples t
CROSS JOIN (VALUES
  ('General Darshan',        '30 min', 0,    'Standard devotee queue access',                      FALSE),
  ('Special Entry Darshan',  '15 min', 300,  'Priority queue with dedicated entry',                TRUE),
  ('VIP Darshan',            '10 min', 1500, 'Exclusive close-proximity darshan',                  FALSE),
  ('Abhishekam',             '45 min', 500,  'Sacred ritual bathing of the deity idol',            FALSE),
  ('Archana',                '20 min', 150,  'Flower offering with 108-name chanting',             FALSE),
  ('Sahasranama Archana',    '60 min', 350,  '1000-name chanting with flowers',                   FALSE),
  ('Kalyanam',               '60 min', 2500, 'Celestial wedding ceremony of the deity',            FALSE),
  ('Brahmotsavam',           '90 min', 5000, 'Grand festival celebration darshan',                 FALSE)
) AS p(name, duration, price, description, popular)
ON CONFLICT DO NOTHING;
