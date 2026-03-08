-- Migration 002: Delivery Sessions
-- Purpose: Admin must press "Start Delivery Run" before the delivery person
--          can mark any deliveries as complete. This prevents accidental bulk marking.

CREATE TABLE IF NOT EXISTS public.delivery_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL UNIQUE,  -- one session per day max
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'evening')),
  started_by TEXT NOT NULL,           -- Clerk user ID of the admin who started it
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,               -- NULL means still active
  active BOOLEAN DEFAULT true
);

ALTER TABLE public.delivery_sessions DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.delivery_sessions TO anon, authenticated;
