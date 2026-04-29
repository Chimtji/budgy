-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID REFERENCES segments(id),
  year INT NOT NULL,
  month INT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, segment_id, year, month)
);

-- Create index for efficient budget queries
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, year, month);
