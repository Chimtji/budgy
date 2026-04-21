# Budgy: Complete Budget Management System - PART 1 (Phases 1-3)

## Executive Summary

You are tasked with implementing the **foundation and core features** of Budgy, a personal budget management system. Users can track spending, identify subscriptions, set budgets, and understand their economy through bank-imported transactions.

**Part 1 Scope: Phases 1-3**

- Phase 1: Core Infrastructure (database, APIs, encryption, stores, rules engine)
- Phase 2: Transaction Management UI & Sync
- Phase 3: Subscriptions Detection & Management

**After Part 1 completes, Part 2 (Phases 4-7) will handle Analytics, Budgets, Settings, and Polish.**

---

## Project Context & Standards

This project follows strict standards defined in `/CLAUDE.md`:

- **Simplicity First:** Avoid over-engineering. Write clear, maintainable code. Don't build for hypothetical future needs.
- **Component Size Limit:** No component file exceeds 150 lines. Split large components into smaller modules.
- **Single Responsibility:** Each function/component does ONE thing well. If it does multiple things, break it down.
- **Tech Stack:**
  - Next.js app router with route groups (e.g., `(dashboard)`)
  - Zustand for state management (pattern: `create` + `persist` + `subscribeWithSelector` + `immer`)
  - Neon Database (PostgreSQL serverless)
  - Mantine UI component library
  - CSS Modules for styling
  - Server actions for all data access (`'use server'`)
- **Data Access Pattern:**
  - All data fetching happens on server via `src/service/database/<feature>`
  - Return `TServerResponse` unions (success/error branching)
  - Verify `isAuthenticated()` at start of every server action
  - Filter all queries by `user_id` from authenticated session
- **Code Organization:**
  - Route-level components in `_components` folders (lowercase)
  - Zustand stores in `src/lib/stores/<feature>`
  - Server actions in `src/service/database/<feature>`
  - Static data in `src/data`
  - Type definitions colocated with features, re-exported via index files

**Language Requirements:**

- All code (variables, functions) in English
- All UI copy (labels, descriptions, placeholders) in Danish
- Comments only where logic isn't self-evident

---

## Architecture Overview

### Key Decisions

- **goCardless Auth:** One-time user authentication. Encrypted refresh tokens stored in DB.
- **Categorization:** User-specific rules pattern-matching + fallback to shared defaults. No license-required AI.
- **Transactions:** Only from bank (no manual entry). All must have category AND segment assigned.
- **Subscriptions:** Auto-detected recurring payments from transaction patterns.
- **Sync:** Manual user-initiated (refresh button).

---

## Database Schema - New Tables (Create via migrations)

```sql
-- goCardless authentication & connection
CREATE TABLE goCardless_requisitions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  requisition_id VARCHAR UNIQUE NOT NULL,
  access_token VARCHAR NOT NULL, -- Store encrypted
  refresh_token VARCHAR NOT NULL, -- Store encrypted
  token_expires_at TIMESTAMP,
  bank_account_id VARCHAR,
  account_name VARCHAR,
  account_iban VARCHAR,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id) -- One connection per user
);

-- Bank transactions (from goCardless)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  external_id VARCHAR NOT NULL, -- goCardless ID
  merchant_name VARCHAR NOT NULL,
  description VARCHAR,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  transaction_date DATE NOT NULL,
  booking_date DATE,
  transaction_type VARCHAR(20), -- DEBIT, CREDIT
  category_id UUID REFERENCES categories(id),
  segment_id UUID REFERENCES segments(id),
  is_manual_override BOOLEAN DEFAULT false,
  notes VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

-- Categorization rule engine
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY,
  user_id UUID, -- NULL = shared default rule
  pattern VARCHAR NOT NULL, -- "SPOTIFY", "NETFLIX*", "*GYM*", regex supported
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID NOT NULL REFERENCES segments(id),
  priority INT DEFAULT 0, -- Higher = match first
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, pattern)
);

-- Detected/confirmed subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  merchant_name VARCHAR NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID NOT NULL REFERENCES segments(id),
  expected_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  cadence VARCHAR(20) NOT NULL, -- MONTHLY, WEEKLY, etc.
  next_due_date DATE,
  last_transaction_id UUID REFERENCES transactions(id),
  detection_confidence INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  notes VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id, segment_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_rules_user_priority ON categorization_rules(user_id, priority DESC);
```

---

## Execution Scope: Part 1 Only

**IMPORTANT:** Execute **only Phases 1, 2, and 3 in sequence without stopping.** After Phase 3 completes, report success and wait for Part 2 to begin.

This is a split implementation to manage token usage. Part 1 focuses on infrastructure, transactions, and subscriptions. Part 2 (Analytics, Budgets, Settings, Polish) comes next.

---

## Implementation Phases 1-3

### Phase 1: Core Infrastructure

Priority: **CRITICAL** - Everything depends on this.

**Tasks:**

1. Create database migrations for all new tables (use existing migration pattern)
2. Add encryption utilities for token storage (`src/service/database/auth/encrypt.ts`)
3. Create `src/service/gocardless/`: client, auth flow, types
4. Create `src/service/categorization/`: matching engine, rules management
5. Create server actions: `src/service/database/transactions/`, `src/service/database/subscriptions/`, `src/service/database/accounts/`
6. Create Zustand store: `src/lib/stores/transactions/transactionsStore.ts`
7. Pre-populate shared categorization rules in a seed script

**Completion Criteria:**

- All migrations run successfully
- Token encryption/decryption tested
- goCardless client can authenticate and fetch transactions
- Rules engine matches patterns correctly
- All server actions return proper `TServerResponse` unions

**What to verify:**

- Migrations applied without errors
- Encryption key from env works
- Sample transaction data fetched from goCardless
- Pattern matching finds correct categories/segments
- Transactions store persists correctly

---

### Phase 2: Transaction Management UI & Sync

Priority: **HIGH** - Users need this to see their data.

**Tasks:**

1. Create `/dashboard/transactions` page
2. Build `TransactionTable.tsx` - List, sort, search, filter by category/segment/date/amount
3. Build `TransactionRow.tsx` - Individual row with merchant, amount, category, segment
4. Build `TransactionDetail.tsx` - Expanded view with full details
5. Build `CategorySegmentAssigner.tsx` - Two-level selector (pick category → pick segment)
6. Build `SyncButton.tsx` - Trigger sync, show status (loading, last sync time, errors)
7. Implement bulk recategorization (checkbox select multiple → reassign all)
8. Show "Uncategorized" transactions section at top
9. Add "Save Rule" button on transaction detail (user can create categorization rule)

**Completion Criteria:**

- Transactions display correctly with filtering
- Sync button fetches and imports transactions
- Categories/segments auto-assign or show uncategorized
- Users can override categories/segments
- Users can create custom rules that persist
- Bulk operations work (select multiple and recategorize)

**What to verify:**

- Sync actually creates new transactions in DB
- Categorization engine called and works
- Manual overrides saved correctly
- New rules prevent future transactions from being miscategorized
- Filters work (category, segment, date range, amount)
- Table responsive on mobile

---

### Phase 3: Subscriptions Detection & Management

Priority: **HIGH** - Users want to see recurring payments.

**Tasks:**

1. Create subscription detection service (`src/service/database/subscriptions/detect.ts`)
   - Find transactions with same merchant in past 90 days
   - Detect cadence pattern (monthly, weekly, etc.)
   - Calculate confidence (0-100 based on regularity)
2. Create subscriptionsStore (Zustand)
3. Repurpose `/dashboard/bills` as Subscriptions page
4. Build `SubscriptionsList.tsx` - Grid/list of subscriptions with amount, cadence, next due
5. Build `SubscriptionRow.tsx` - Individual subscription card
6. Build `SubscriptionForm.tsx` - Create/edit subscription (merchant, amount, cadence, category, segment)
7. Show "Detected Subscriptions" section with confirmation flow
8. Allow manual subscription creation

**Completion Criteria:**

- Detection algorithm finds recurring patterns (e.g., Netflix monthly)
- UI shows detected subscriptions for user confirmation
- Users can confirm/edit detected subscriptions
- All subscriptions have category AND segment assigned
- Manual subscription creation works
- Subscriptions store persists correctly

**What to verify:**

- Detection finds transactions with same merchant
- Cadence calculated correctly (monthly, weekly, biweekly, yearly)
- Confidence score reflects pattern regularity
- Confirmation UI shows suggested subscriptions
- Users can edit detected subscriptions
- Manual creation adds to store and DB
- All subscriptions have required category/segment

---

## Code Patterns & Examples

### Server Action Template

```typescript
// src/service/database/transactions/getTransactionsByMonth.ts
'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export const getTransactionsByMonth = async (
  year: number,
  month: number,
  page: number = 1,
  limit: number = 100
): Promise<TServerResponse<Transaction[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const result = await sqlClient`
      SELECT * FROM transactions
      WHERE user_id = ${auth.userId}
      AND EXTRACT(YEAR FROM transaction_date) = ${year}
      AND EXTRACT(MONTH FROM transaction_date) = ${month}
      ORDER BY transaction_date DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    return {
      status: 200,
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: 'Failed to fetch transactions',
    };
  }
};
```

### Zustand Store Template

```typescript
// src/lib/stores/transactions/transactionsStore.ts
'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, subscribeWithSelector } from 'zustand/react';

interface TransactionState {
  transactions: Map<string, Transaction>;
  isLoading: boolean;
  filters: {
    category?: UUID;
    segment?: UUID;
    startDate?: Date;
    endDate?: Date;
  };
  actions: {
    add: (transaction: Transaction) => void;
    update: (id: UUID, updates: Partial<Transaction>) => void;
    remove: (id: UUID) => void;
    fetchByMonth: (year: number, month: number) => Promise<void>;
    setFilter: (filter: Partial<TransactionState['filters']>) => void;
  };
}

export const useTransactionsStore = create<TransactionState>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        transactions: new Map(),
        isLoading: false,
        filters: {},
        actions: {
          add: (transaction) =>
            set((state) => {
              state.transactions.set(transaction.id, transaction);
            }),
          fetchByMonth: async (year, month) => {
            set((state) => {
              state.isLoading = true;
            });
            const result = await getTransactionsByMonth(year, month);
            set((state) => {
              if (result.success) {
                result.data.forEach((tx) => state.transactions.set(tx.id, tx));
              }
              state.isLoading = false;
            });
          },
        },
      }))
    ),
    {
      name: 'transactions-store',
      version: 1,
    }
  )
);
```

### Component Template (<150 lines)

```typescript
// src/app/(dashboard)/transactions/_components/TransactionRow.tsx
'use client';

import { Transaction } from '@/data/types';
import { getCategoryLabel, getSegmentLabel } from '@/data/helpers';
import { formatCurrency } from '@/lib/utilities/format';
import classes from './TransactionRow.module.css';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (id: UUID) => void;
}

export default function TransactionRow({
  transaction,
  onEdit,
}: TransactionRowProps) {
  const isIncome = transaction.transaction_type === 'CREDIT';

  return (
    <div
      className={classes.row}
      onClick={() => onEdit(transaction.id)}
      role="button"
      tabIndex={0}
    >
      <div className={classes.merchant}>
        <div className={classes.name}>{transaction.merchant_name}</div>
        <div className={classes.description}>{transaction.description}</div>
      </div>

      <div className={classes.category}>
        {transaction.category_id ? (
          <>
            <span>{getCategoryLabel(transaction.category_id)}</span>
            <span className={classes.segment}>
              {getSegmentLabel(transaction.segment_id)}
            </span>
          </>
        ) : (
          <span className={classes.uncategorized}>Ikke kategoriseret</span>
        )}
      </div>

      <div className={`${classes.amount} ${isIncome ? classes.income : ''}`}>
        {formatCurrency(transaction.amount)}
      </div>

      <div className={classes.date}>
        {new Date(transaction.transaction_date).toLocaleDateString('da-DK')}
      </div>
    </div>
  );
}
```

---

## Part 1 File & Directory Structure

After Part 1 completes, your new files/structure will be:

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── TransactionTable.tsx
│   │   │       ├── TransactionRow.tsx
│   │   │       ├── TransactionDetail.tsx
│   │   │       ├── CategorySegmentAssigner.tsx
│   │   │       ├── SyncButton.tsx
│   │   │       └── *.module.css
│   │   ├── bills/ (now subscriptions)
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── SubscriptionsList.tsx
│   │   │       ├── SubscriptionRow.tsx
│   │   │       ├── SubscriptionForm.tsx
│   │   │       ├── RecurrenceIndicator.tsx
│   │   │       └── *.module.css
│   │   └── layout.tsx (update navigation)
├── service/
│   ├── gocardless/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   └── types.ts
│   ├── categorization/
│   │   ├── engine.ts
│   │   ├── rules.ts
│   │   └── ai.ts (optional)
│   └── database/
│       ├── transactions/
│       │   ├── getTransactionsByMonth.ts
│       │   ├── getTransaction.ts
│       │   ├── updateTransactionCategory.ts
│       │   ├── deleteTransaction.ts
│       │   └── syncTransactionsFromBank.ts
│       ├── subscriptions/
│       │   ├── getSubscriptions.ts
│       │   ├── updateSubscription.ts
│       │   ├── createSubscription.ts
│       │   ├── deleteSubscription.ts
│       │   └── detect.ts
│       └── accounts/
│           ├── initiateConnection.ts
│           ├── saveCredentials.ts
│           ├── validateConnection.ts
│           └── disconnectBank.ts
├── lib/
│   └── stores/
│       ├── transactions/
│       │   ├── transactionsStore.ts
│       │   └── types.ts
│       └── subscriptions/
│           ├── subscriptionsStore.ts
│           └── types.ts
└── scripts/
    └── migrations/
        ├── 003_create_transactions.sql
        ├── 004_create_subscriptions.sql
        ├── 005_create_categorization_rules.sql
        └── 006_seed_default_rules.sql
```

---

## Environment Variables Required

```
# goCardless
NEXT_PUBLIC_GOCARDLESS_CLIENT_ID=<your_client_id>
GOCARDLESS_CLIENT_SECRET=<your_secret>
NEXT_PUBLIC_GOCARDLESS_REDIRECT_URI=<your_app_url>/api/callbacks/gocardless

# Encryption
ENCRYPTION_KEY=<32-byte-hex-key-for-token-encryption>

# Database (already configured)
DATABASE_URL=<neon_connection_string>
```

---

## Key Constraints & Requirements for Part 1

1. **All transactions & subscriptions MUST have both category AND segment assigned** - No nulls (except initial uncategorized state)
2. **User data isolation is CRITICAL** - Every query must filter by user_id. No cross-user data access.
3. **Transactions are read-only from bank** - Import only, no manual creation.
4. **Rules are user-specific** - Each user has their own rules plus inherited shared default rules.
5. **Token security** - All goCardless tokens encrypted in DB, never logged.
6. **Component size limit** - No component exceeds 150 lines.
7. **Zustand middleware consistency** - All stores use `create` + `persist` + `subscribeWithSelector` + `immer`.

---

## Part 1 Execution Workflow

Execute **Phases 1, 2, 3 sequentially without stopping:**

1. **Start Phase 1** - Set up infrastructure, database, encryption, APIs, stores
2. **Verify Phase 1** - Test migrations, encryption, goCardless client, rules engine
3. **Immediately start Phase 2** - Build transaction UI on phase 1 infrastructure
4. **Verify Phase 2** - Test transactions display, sync, filtering, categorization
5. **Immediately start Phase 3** - Add subscription detection
6. **Verify Phase 3** - Test subscription detection, confirmation, creation

**Do not stop between phases.** Proceed systematically.

---

## Part 1 Success Checklist

Phase 1-3 Complete When:

- ✅ All database migrations applied successfully
- ✅ Token encryption/decryption working
- ✅ goCardless client authenticates and fetches transactions
- ✅ Categorization rules engine matches patterns correctly
- ✅ Transactions table displays with sorting/filtering/search
- ✅ Sync button imports and categorizes transactions
- ✅ Users can override categories/segments
- ✅ Users can create custom categorization rules
- ✅ Subscriptions detected from transaction patterns
- ✅ Detected subscriptions shown with confidence scores
- ✅ Users can confirm/edit subscriptions
- ✅ All transactions and subscriptions have category AND segment
- ✅ All data properly scoped to authenticated user only
- ✅ No cross-user data visible
- ✅ End-to-end test: Connect bank → Sync → View transactions → Create subscription

---

## Notes for Implementation

- **Start with Phase 1** - Don't skip infrastructure. Everything depends on it.
- **Test user isolation constantly** - Make sure user A can't see user B's data.
- **Handle errors gracefully** - Show user-friendly messages, log details server-side.
- **Use existing patterns** - Follow the bills/companies implementation as reference.
- **Keep it simple** - Don't over-architect. Pattern matching rules, standard REST, simple queries.
- **Mobile first** - Mantine components are responsive by default; test on mobile.
- **Performance** - Paginate transaction lists, cache categories, lazy-load charts.

---

## When Part 1 is Complete

**Report success with:**

- Summary of what was implemented (Phases 1-3)
- Database status (tables created, indexes applied)
- Feature verification (transactions import/display, subscriptions detect/manage)
- Any known issues or limitations
- Ready status for Part 2

Then wait for Part 2 prompt which will handle:

- Phase 4: Economy Overview & Analytics
- Phase 5: Budget Management
- Phase 6: Bank Integration & Settings
- Phase 7: Polish & Security

---

## Good luck! Execute Phases 1-3 without stopping.

Follow the phases in order. Reference existing code for patterns. If stuck, check how bills/companies were implemented.
