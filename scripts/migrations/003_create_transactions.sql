-- Create transactions table (from CSV import)
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
