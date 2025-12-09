-- CockroachDB Schema for Configurations
-- Run this SQL in your CockroachDB database

CREATE TABLE IF NOT EXISTS configurations (
  configuration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id STRING NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for user_id to optimize queries
CREATE INDEX IF NOT EXISTS idx_user_id ON configurations (user_id);

