-- Create goCardless requisitions table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS gocardless_requisitions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  requisition_id VARCHAR UNIQUE NOT NULL,
  access_token VARCHAR NOT NULL,
  refresh_token VARCHAR NOT NULL,
  token_expires_at TIMESTAMP,
  bank_account_id VARCHAR,
  account_name VARCHAR,
  account_iban VARCHAR,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  external_id VARCHAR NOT NULL,
  merchant_name VARCHAR NOT NULL,
  description VARCHAR,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  transaction_date DATE NOT NULL,
  booking_date DATE,
  transaction_type VARCHAR(20),
  category_id UUID REFERENCES categories(id),
  segment_id UUID REFERENCES segments(id),
  is_manual_override BOOLEAN DEFAULT false,
  notes VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, external_id)
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_gocardless_requisitions_user ON gocardless_requisitions(user_id);
