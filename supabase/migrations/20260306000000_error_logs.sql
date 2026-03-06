-- Error logging table for frontend error tracking
-- Run this in Supabase SQL Editor (CLI IPv6 not available)

CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  message     text NOT NULL,
  stack       text,
  source      text NOT NULL,          -- e.g. 'gameStore', 'authStore', 'global', 'ErrorBoundary'
  severity    text NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warn', 'fatal')),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url    text,
  user_agent  text,
  extra       jsonb DEFAULT '{}'::jsonb,
  fingerprint text NOT NULL           -- hash of message+source for dedup
);

-- Index for querying by severity and time
CREATE INDEX idx_error_logs_severity_created ON error_logs (severity, created_at DESC);

-- Index for fingerprint dedup queries
CREATE INDEX idx_error_logs_fingerprint ON error_logs (fingerprint);

-- RLS: anyone can INSERT (even anonymous), only service_role can SELECT/DELETE
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies = only accessible via Dashboard or service_role
