-- Create categorization rules table
CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  pattern VARCHAR NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID NOT NULL REFERENCES segments(id),
  priority INT DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pattern)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  merchant_name VARCHAR NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID NOT NULL REFERENCES segments(id),
  expected_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  cadence VARCHAR(20) NOT NULL,
  next_due_date DATE,
  last_transaction_id UUID REFERENCES transactions(id),
  detection_confidence INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  notes VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rules_user_priority ON categorization_rules(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_rules_pattern ON categorization_rules(pattern);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant ON subscriptions(user_id, merchant_name);
