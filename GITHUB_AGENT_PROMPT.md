# Budgy: Complete Budget Management System - GitHub Agent Prompt

## Executive Summary

You are tasked with implementing a complete personal budget management system for Budgy. The app helps users track spending, identify subscriptions, set budgets, and understand their economy through bank-imported transactions and analytics.

**Current Status:** The codebase has bills tracking (to be replaced), basic UI components, authentication, and infrastructure ready. You will replace the bills feature with a transactions-based system connected to goCardless bank integration.

**Key MVP Features:**

1. Import transactions from user's bank via goCardless
2. Auto-categorize transactions using rules engine (user-specific + shared defaults)
3. Detect recurring subscriptions from transaction patterns
4. Set budgets per category/segment per month
5. Display spending analytics and trends
6. All features scoped to authenticated user only

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
- **Budgets:** Monthly per category/segment. Visual indicators only (no alerts).
- **Sync:** Manual user-initiated (refresh button).

---

## Database Schema

### New Tables (Create via migrations)

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

-- Budget targets
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  segment_id UUID REFERENCES segments(id),
  year INT NOT NULL,
  month INT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, segment_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id, segment_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_rules_user_priority ON categorization_rules(user_id, priority DESC);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, year, month);
```

---

## Implementation Scope & Execution Model

**IMPORTANT:** Execute **ALL 7 phases in sequence without stopping.** After each phase completes, immediately proceed to the next phase. Do not wait for external instruction or approval between phases.

Each phase builds on the previous, so the full implementation requires all phases to be executed together. Work through them systematically.

---

## Implementation Phases (Execute ALL in Order)

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
8. Show "Uncategorized" transactions section
9. Add "Save Rule" button on transaction detail (user can create categorization rule)

**Completion Criteria:**

- Transactions display correctly
- Filtering/searching works
- Sync imports transactions and categorizes them
- Users can override categories/segments
- Users can create rules

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
7. Show "Detected Subscriptions" with confirmation flow ("Netflix monthly at €11.99 - Confirm?")
8. Allow manual subscription creation

**Completion Criteria:**

- Detection algorithm finds recurring patterns
- UI shows detected subscriptions for user confirmation
- Users can confirm/edit subscriptions
- All subscriptions have category AND segment
- Manual subscription creation works

---

### Phase 4: Economy Overview & Analytics

Priority: **MEDIUM** - Dashboard/summary view.

**Tasks:**

1. Create analytics service (`src/service/database/analytics/`)
   - `getMonthlyStats()` - In/out totals by category
   - `getTrendData()` - Month-over-month comparison
   - `getCategoryBreakdown()` - Percentages
   - `getRecurringBreakdown()` - Recurring vs one-time forecast
2. Create statsStore (Zustand)
3. Create `(overview)` route group
4. Build `/dashboard/overview` page
5. Build `EconomyOverview.tsx` - Main container
6. Build `TotalSpendCard.tsx` - In/out totals for selected month
7. Build `CategoryBreakdown.tsx` - Pie/bar chart of spending by category
8. Build `TrendChart.tsx` - Line chart of last 6 months
9. Build `RecurringVsOneTime.tsx` - Breakdown of fixed vs variable
10. Build `LatestTransactions.tsx` - Recent transaction feed

**Completion Criteria:**

- Overview page loads correctly
- Charts render with real data
- Trends calculated accurately
- Responsive on mobile
- Fast load times (consider caching)

---

### Phase 5: Budget Management (Complete)

Priority: **MEDIUM** - Budget tracking.

**Tasks:**

1. Complete `src/lib/stores/budgets/budgetsStore.ts` implementation
   - Fetch all user budgets for selected year/month
   - Calculate actual spending vs target
   - Track dirty cells for efficient save
2. Create `/dashboard/budgets` page
3. Build `BudgetGrid.tsx` - Matrix: rows = categories, cols = segments/months
4. Build `BudgetCell.tsx` - Input for budget target, shows progress bar
5. Build `BudgetProgress.tsx` - Visual indicator (0-100%), color coded
6. Build `BudgetComparison.tsx` - Month-over-month budget comparison
7. Add save/cancel buttons to persist changes

**Completion Criteria:**

- Users can set budgets per category/segment/month
- Progress shows actual vs target
- Budgets persist correctly
- UI is intuitive (matrix format works well)

---

### Phase 6: Bank Integration & Settings

Priority: **MEDIUM** - Connection management.

**Tasks:**

1. Create `src/app/settings/` page (or integrate to existing account page)
2. Build `BankConnectionModal.tsx` - goCardless OAuth setup flow
3. Build `ConnectionStatus.tsx` - Show connected bank, account number, last sync
4. Build `SyncStatus.tsx` - Sync status, error messages
5. Build `DisconnectButton.tsx` - Disconnect with confirmation
6. Implement OAuth callback endpoint
7. Add error recovery (retry on token refresh failure)
8. Show sync history/logs

**Completion Criteria:**

- Users can connect bank via OAuth
- Connection status shows clearly
- Disconnect works safely
- Error messages are user-friendly

---

### Phase 7: Polish & Security

Priority: **HIGH** - Before shipping.

**Tasks:**

1. Security audit:
   - Token encryption verified (no plaintext tokens)
   - All queries filter by user_id
   - Error messages don't leak details
   - Prepared statements used everywhere
2. Add pagination for transaction lists (100 items per page)
3. Add loading states to all async operations
4. Error boundaries on main pages
5. Mobile responsiveness test
6. Accessibility review (WCAG 2.1 AA)
7. Performance optimization (lazy load charts, memoization)
8. Test all user data isolation (user A can't see user B's data)

**Completion Criteria:**

- No security vulnerabilities
- Good performance
- User data properly isolated
- Mobile-friendly

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
          update: (id, updates) =>
            set((state) => {
              const tx = state.transactions.get(id);
              if (tx) Object.assign(tx, updates);
            }),
          remove: (id) =>
            set((state) => {
              state.transactions.delete(id);
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
          setFilter: (filter) =>
            set((state) => {
              state.filters = { ...state.filters, ...filter };
            }),
        },
      }))
    ),
    {
      name: 'transactions-store',
      version: 1,
    }
  )
);

// Selector for derived data
export const useTransactionsByMonth = (year: number, month: number) =>
  useTransactionsStore((state) => {
    return Array.from(state.transactions.values())
      .filter((tx) => {
        const txDate = new Date(tx.transaction_date);
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
      })
      .sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
  });
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

## File & Directory Structure

After full implementation, your structure should look like:

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── (overview)/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── EconomyOverview.tsx
│   │   │       ├── TotalSpendCard.tsx
│   │   │       ├── CategoryBreakdown.tsx
│   │   │       ├── TrendChart.tsx
│   │   │       ├── RecurringVsOneTime.tsx
│   │   │       └── LatestTransactions.tsx
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── TransactionTable.tsx
│   │   │       ├── TransactionRow.tsx
│   │   │       ├── TransactionDetail.tsx
│   │   │       ├── CategorySegmentAssigner.tsx
│   │   │       ├── SyncButton.tsx
│   │   │       └── *.module.css
│   │   ├── bills/
│   │   │   ├── page.tsx (subscriptions manager)
│   │   │   └── _components/
│   │   │       ├── SubscriptionsList.tsx
│   │   │       ├── SubscriptionRow.tsx
│   │   │       ├── SubscriptionForm.tsx
│   │   │       ├── RecurrenceIndicator.tsx
│   │   │       └── *.module.css
│   │   ├── budgets/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── BudgetGrid.tsx
│   │   │       ├── BudgetCell.tsx
│   │   │       ├── BudgetProgress.tsx
│   │   │       ├── BudgetComparison.tsx
│   │   │       └── *.module.css
│   │   ├── settings/ (or account/)
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── BankConnectionModal.tsx
│   │   │       ├── ConnectionStatus.tsx
│   │   │       ├── SyncStatus.tsx
│   │   │       └── DisconnectButton.tsx
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
│       ├── accounts/
│       │   ├── initiateConnection.ts
│       │   ├── saveCredentials.ts
│       │   ├── validateConnection.ts
│       │   └── disconnectBank.ts
│       ├── analytics/
│       │   ├── getMonthlyStats.ts
│       │   ├── getTrendData.ts
│       │   ├── getCategoryBreakdown.ts
│       │   ├── getSpendingVelocity.ts
│       │   └── getRecurringBreakdown.ts
│       └── budgets/ (complete)
│           ├── getBudgets.ts
│           ├── saveBudgets.ts
│           └── getBudgetProgress.ts
├── lib/
│   └── stores/
│       ├── transactions/
│       │   ├── transactionsStore.ts
│       │   └── types.ts
│       ├── subscriptions/
│       │   ├── subscriptionsStore.ts
│       │   └── types.ts
│       ├── stats/
│       │   ├── statsStore.ts
│       │   └── types.ts
│       └── budgets/ (complete)
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

## Key Constraints & Requirements

1. **All transactions & subscriptions MUST have both category AND segment assigned** - No nulls allowed for these fields (except initial uncategorized state)
2. **User data isolation is CRITICAL** - Every query must filter by user_id. No user can see another user's data.
3. **Transactions are read-only from bank** - Import only, no manual creation. Users can only edit category/segment.
4. **Rules are user-specific** - Each user has their own rules plus inherited shared default rules.
5. **No budget alerts** - Only visual progress indicators.
6. **Token security** - All goCardless tokens encrypted in DB, never logged.
7. **Component size limit** - No component exceeds 150 lines.
8. **Zustand middleware consistency** - All stores use `create` + `persist` + `subscribeWithSelector` + `immer` pattern.

---

## Success Criteria - MVP Complete When:

- ✅ Users can connect to bank via goCardless (OAuth flow)
- ✅ Transactions import and display in table
- ✅ Categories and segments auto-assign via rules (user + shared fallback)
- ✅ Users can override category/segment on any transaction
- ✅ Users can create custom categorization rules
- ✅ Subscriptions auto-detected from transaction patterns
- ✅ Users can confirm/edit subscriptions
- ✅ Budget targets set per category/segment/month
- ✅ Economy overview shows spending analysis with charts
- ✅ All data scoped to authenticated user only
- ✅ Security audit passed (no token leaks, proper isolation)
- ✅ Mobile responsive
- ✅ All features working end-to-end

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

## Execution Workflow

This is **NOT** a multi-prompt task. Execute all phases in a single continuous workflow:

1. **Start Phase 1** - Set up infrastructure, database, encryption, API clients, stores
2. **Verify Phase 1** - Test that all infrastructure works (run migrations, test client, etc.)
3. **Immediately start Phase 2** - Build transaction UI on top of Phase 1 infrastructure
4. **Verify Phase 2** - Test transactions display and sync work
5. **Immediately start Phase 3** - Add subscriptions detection
6. **Continue through Phase 4, 5, 6, 7** - Each phase depends on previous phases

**Do not stop between phases.** Proceed systematically through all 7 until the MVP is complete.

---

## Final Checklist - MVP Complete When ALL Are Done:

- ✅ Phase 1: Infrastructure ready (DB, encryption, APIs, stores, rules)
- ✅ Phase 2: Transactions display, sync, and categorization working
- ✅ Phase 3: Subscriptions detected, confirmed, managed
- ✅ Phase 4: Economy overview with charts and analytics
- ✅ Phase 5: Budget grid complete with targets and progress
- ✅ Phase 6: Bank connection settings, sync status, disconnect
- ✅ Phase 7: Security audit passed, performance optimized, mobile tested
- ✅ All transactions/subscriptions have category AND segment
- ✅ User data completely isolated (no cross-user data access)
- ✅ End-to-end testing: Connect bank → Sync → View transactions → Set budgets → Review analytics

---

## Got it? Start Phase 1. Proceed through all 7 without stopping.

Good luck! Follow the phases in order. Reference existing code for patterns (bills, companies, categories stores). If you get stuck, check how those features were implemented and apply similar patterns.
