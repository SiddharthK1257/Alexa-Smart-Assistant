-- Supabase Migration: 20261021000004_add_alexa_plus_features.sql
-- Alexa+ Extended Capabilities: Connected Devices, OpenTable Dining, Hotel Bookings, Music Playback & Calendar

-- 1. Connected Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('echo_speaker', 'echo_show', 'smart_light', 'thermostat', 'smart_plug', 'tv', 'soundbar', 'doorbell')),
  room TEXT NOT NULL DEFAULT 'Living Room',
  is_connected BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'standby' CHECK (status IN ('connected', 'standby', 'disconnected', 'pairing')),
  settings JSONB NOT NULL DEFAULT '{"power": true, "volume": 60, "brightness": 80, "temperature": 72}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_devices_timestamp ON public.devices;
CREATE TRIGGER set_devices_timestamp
BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
CREATE POLICY "Users can view own devices" ON public.devices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devices" ON public.devices;
CREATE POLICY "Users can insert own devices" ON public.devices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own devices" ON public.devices;
CREATE POLICY "Users can update own devices" ON public.devices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own devices" ON public.devices;
CREATE POLICY "Users can delete own devices" ON public.devices FOR DELETE USING (auth.uid() = user_id);

-- 2. OpenTable Accounts Table
CREATE TABLE IF NOT EXISTS public.opentable_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  is_linked BOOLEAN NOT NULL DEFAULT true,
  vip_status BOOLEAN NOT NULL DEFAULT false,
  dining_points INTEGER NOT NULL DEFAULT 250,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_opentable_accounts_timestamp ON public.opentable_accounts;
CREATE TRIGGER set_opentable_accounts_timestamp
BEFORE UPDATE ON public.opentable_accounts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE public.opentable_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own opentable account" ON public.opentable_accounts;
CREATE POLICY "Users can view own opentable account" ON public.opentable_accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own opentable account" ON public.opentable_accounts;
CREATE POLICY "Users can upsert own opentable account" ON public.opentable_accounts FOR ALL USING (auth.uid() = user_id);

-- 3. Restaurant Reservations Table
CREATE TABLE IF NOT EXISTS public.restaurant_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  cuisine TEXT NOT NULL DEFAULT 'Contemporary',
  location TEXT NOT NULL DEFAULT 'Downtown',
  party_size INTEGER NOT NULL DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  image_url TEXT,
  confirmation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_restaurant_reservations_timestamp ON public.restaurant_reservations;
CREATE TRIGGER set_restaurant_reservations_timestamp
BEFORE UPDATE ON public.restaurant_reservations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_user_id ON public.restaurant_reservations(user_id);
ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can view own reservations" ON public.restaurant_reservations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can insert own reservations" ON public.restaurant_reservations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can update own reservations" ON public.restaurant_reservations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can delete own reservations" ON public.restaurant_reservations FOR DELETE USING (auth.uid() = user_id);

-- 4. Hotel Bookings Table
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  room_type TEXT NOT NULL DEFAULT 'Deluxe King Suite',
  total_price NUMERIC(10,2) NOT NULL DEFAULT 349.00,
  image_url TEXT,
  confirmation_code TEXT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 4.8,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  amenities TEXT[] NOT NULL DEFAULT ARRAY['Free WiFi', 'Pool', 'Breakfast Included', 'Spa'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_hotel_bookings_timestamp ON public.hotel_bookings;
CREATE TRIGGER set_hotel_bookings_timestamp
BEFORE UPDATE ON public.hotel_bookings
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user_id ON public.hotel_bookings(user_id);
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own hotel bookings" ON public.hotel_bookings;
CREATE POLICY "Users can view own hotel bookings" ON public.hotel_bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own hotel bookings" ON public.hotel_bookings;
CREATE POLICY "Users can insert own hotel bookings" ON public.hotel_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own hotel bookings" ON public.hotel_bookings;
CREATE POLICY "Users can update own hotel bookings" ON public.hotel_bookings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own hotel bookings" ON public.hotel_bookings;
CREATE POLICY "Users can delete own hotel bookings" ON public.hotel_bookings FOR DELETE USING (auth.uid() = user_id);

-- 5. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('hotel', 'restaurant', 'reminder', 'personal')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  description TEXT,
  image_url TEXT,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_calendar_events_timestamp ON public.calendar_events;
CREATE TRIGGER set_calendar_events_timestamp
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time ASC);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
CREATE POLICY "Users can view own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
CREATE POLICY "Users can update own calendar events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- 6. Music Playback State Table
CREATE TABLE IF NOT EXISTS public.music_playback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_track JSONB NOT NULL DEFAULT '{"title": "Midnight Chill Lo-Fi", "artist": "Alexa Beats", "album": "Study Waves Vol. 1", "duration": 184, "album_art": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80", "genre": "Lo-Fi / Ambient"}'::jsonb,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  volume INTEGER NOT NULL DEFAULT 70,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.music_playback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own music playback" ON public.music_playback;
CREATE POLICY "Users can view own music playback" ON public.music_playback FOR ALL USING (auth.uid() = user_id);

-- 7. Seed initial devices for demo user (if demo user exists)
DO $$
DECLARE
  v_demo_id UUID;
BEGIN
  SELECT id INTO v_demo_id FROM auth.users WHERE email = 'alexa.demo@example.com' LIMIT 1;
  IF v_demo_id IS NOT NULL THEN
    -- Insert default smart home devices
    INSERT INTO public.devices (user_id, name, type, room, is_connected, status, settings)
    VALUES
      (v_demo_id, 'Echo Studio', 'echo_speaker', 'Living Room', true, 'connected', '{"power": true, "volume": 65, "audio_mode": "spatial"}'),
      (v_demo_id, 'Echo Show 10', 'echo_show', 'Kitchen', true, 'connected', '{"power": true, "volume": 70, "screen_on": true}'),
      (v_demo_id, 'Philips Hue Ceiling Aura', 'smart_light', 'Living Room', true, 'connected', '{"power": true, "brightness": 85, "color": "#00CAFF"}'),
      (v_demo_id, 'Nest Smart Thermostat', 'thermostat', 'Hallway', true, 'connected', '{"power": true, "temperature": 71, "mode": "eco"}'),
      (v_demo_id, 'Fire TV 4K Max', 'tv', 'Bedroom', false, 'standby', '{"power": false, "volume": 40}'),
      (v_demo_id, 'Smart Espresso Plug', 'smart_plug', 'Kitchen', false, 'standby', '{"power": false}')
    ON CONFLICT DO NOTHING;

    -- Pre-link OpenTable demo account
    INSERT INTO public.opentable_accounts (user_id, email, phone, full_name, is_linked, vip_status, dining_points)
    VALUES (v_demo_id, 'alexa.demo@example.com', '+1 (555) 234-5678', 'Alexa Demo User', true, true, 1250)
    ON CONFLICT (user_id) DO NOTHING;

    -- Pre-seed demo restaurant reservation
    INSERT INTO public.restaurant_reservations (user_id, restaurant_name, cuisine, location, party_size, reservation_date, reservation_time, image_url, confirmation_code, status)
    VALUES (
      v_demo_id,
      'Osteria del Mare',
      'Contemporary Italian',
      'Oceanfront Promenade, Pier 7',
      2,
      CURRENT_DATE + INTERVAL '2 days',
      '19:30:00',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      'OT-92841',
      'confirmed'
    ) ON CONFLICT DO NOTHING;

    -- Pre-seed demo hotel booking
    INSERT INTO public.hotel_bookings (user_id, hotel_name, destination, check_in_date, check_out_date, guests, room_type, total_price, image_url, confirmation_code, rating, status)
    VALUES (
      v_demo_id,
      'The Grand Azure Horizon Resort',
      'Santorini, Greece',
      CURRENT_DATE + INTERVAL '14 days',
      CURRENT_DATE + INTERVAL '19 days',
      2,
      'Infinity Oceanview Villa',
      1280.00,
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      'HTL-48201',
      4.9,
      'confirmed'
    ) ON CONFLICT DO NOTHING;

    -- Add both to Calendar
    INSERT INTO public.calendar_events (user_id, title, event_type, start_time, end_time, location, description, image_url, reference_id)
    VALUES
      (
        v_demo_id,
        'Dinner at Osteria del Mare (OpenTable)',
        'restaurant',
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '19 hours 30 minutes')::TIMESTAMPTZ,
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '21 hours 30 minutes')::TIMESTAMPTZ,
        'Oceanfront Promenade, Pier 7',
        'Confirmed table for 2 guests. Confirmation: OT-92841.',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        'OT-92841'
      ),
      (
        v_demo_id,
        'Hotel Stay: The Grand Azure Horizon Resort',
        'hotel',
        (CURRENT_DATE + INTERVAL '14 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
        (CURRENT_DATE + INTERVAL '19 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
        'Santorini, Greece',
        'Infinity Oceanview Villa for 2 guests. Confirmation: HTL-48201. Total: $1,280.00.',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
        'HTL-48201'
      )
    ON CONFLICT DO NOTHING;

    -- Initialize music playback
    INSERT INTO public.music_playback (user_id, current_track, is_playing, progress_seconds, volume)
    VALUES (
      v_demo_id,
      '{"title": "Midnight Chill Lo-Fi", "artist": "Alexa Beats", "album": "Study Waves Vol. 1", "duration": 184, "album_art": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80", "genre": "Lo-Fi / Ambient"}'::jsonb,
      false,
      0,
      70
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
