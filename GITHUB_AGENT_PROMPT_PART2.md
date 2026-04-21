# Budgy: Complete Budget Management System - PART 2 (Phases 4-7)

## Executive Summary

**PREREQUISITE: Part 1 (Phases 1-3) must be completed and working before starting this.**

You are now implementing the **analytics, budgets, settings, and polish** features of Budgy. This Part builds on the complete infrastructure, transactions, and subscriptions from Part 1.

**Part 2 Scope: Phases 4-7**

- Phase 4: Economy Overview & Analytics
- Phase 5: Budget Management
- Phase 6: Bank Integration & Settings
- Phase 7: Polish & Security

**Assumption:** All of Part 1 is working:

- Database tables created (transactions, subscriptions, rules, etc.)
- goCardless integration functional
- Transaction sync working
- Subscription detection working
- Transactions and subscriptions stores ready
- Categorization rules engine functional

---

## Project Context & Standards

This project follows `/CLAUDE.md` standards (same as Part 1):

- **Simplicity First:** Clear, maintainable code. No over-engineering.
- **Component Size Limit:** Max 150 lines per component file.
- **Single Responsibility:** Each function/component does ONE thing.
- **Tech Stack:**
  - Next.js app router with route groups
  - Zustand for state (pattern: `create` + `persist` + `subscribeWithSelector` + `immer`)
  - Neon Database (PostgreSQL)
  - Mantine UI
  - CSS Modules
  - Server actions for data access
- **Data Access:** All via `src/service/database/<feature>`, return `TServerResponse` unions
- **Code Organization:**
  - Components in `_components` folders
  - Stores in `src/lib/stores/<feature>`
  - Server actions in `src/service/database/<feature>`

**Language:** English code, Danish UI copy.

---

## Architecture Overview

### Key Decisions (from Part 1)

- **Transactions:** Imported from bank only. All have category AND segment.
- **Subscriptions:** Auto-detected from patterns or manually created.
- **Budgets:** Monthly per category/segment. Visual indicators only (no alerts).
- **Analytics:** Real-time spending updates from transactions table.
- **Settings:** Bank connection management (connect/disconnect).

---

## Database Review - Tables Created in Part 1

All tables already exist from Part 1 migrations:

- `goCardless_requisitions` - OAuth tokens (encrypted)
- `transactions` - Bank transactions
- `categorization_rules` - User-specific + shared rules
- `subscriptions` - Detected/confirmed recurring payments
- `budgets` - Budget targets per category/segment/month

Create index for budgets if not done in Part 1:

```sql
CREATE INDEX idx_budgets_user_month ON budgets(user_id, year, month);
```

---

## Execution Scope: Part 2 Only

**IMPORTANT:** Execute **only Phases 4, 5, 6, and 7 in sequence without stopping.** After Phase 7 (Polish & Security), MVP is complete.

---

## Implementation Phases 4-7

### Phase 4: Economy Overview & Analytics

Priority: **MEDIUM** - Dashboard/summary view.

**Tasks:**

1. Create analytics service (`src/service/database/analytics/`)
   - `getMonthlyStats()` - In/out totals by category
   - `getTrendData()` - Month-over-month comparison (last 6 months)
   - `getCategoryBreakdown()` - Percentages by category
   - `getRecurringBreakdown()` - Forecast recurring vs one-time
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
- Charts render with real data from transactions table
- Trends calculated accurately (month-over-month)
- Recurring vs one-time breakdown shows forecast
- Responsive on mobile
- Charts load efficiently (consider caching)

**What to verify:**

- Stats queries work with user isolation
- Charts from Recharts render correctly
- Trend data accurate (compare previous months)
- Breakdown percentages sum to 100%
- Recent transactions show with merchant/amount
- Page responsive on mobile

---

### Phase 5: Budget Management (Complete)

Priority: **MEDIUM** - Budget tracking.

**Tasks:**

1. Complete `src/lib/stores/budgets/budgetsStore.ts` implementation
   - Fetch all user budgets for selected year/month
   - Calculate actual spending vs target
   - Track dirty cells for efficient save
   - Derive aggregates (total budget, total spent, % over/under)
2. Create budget server actions: `src/service/database/budgets/`
   - `getBudgets()` - Fetch user budgets
   - `saveBudgets()` - Upsert multiple budgets
   - `getBudgetProgress()` - Calculate actual vs target
3. Create `/dashboard/budgets` page
4. Build `BudgetGrid.tsx` - Matrix view: rows = categories, cols = segments or months
5. Build `BudgetCell.tsx` - Input for budget target, shows progress
6. Build `BudgetProgress.tsx` - Visual indicator (0-100%), color coded (green < 75%, yellow 75-100%, red > 100%)
7. Build `BudgetComparison.tsx` - Month-over-month budget comparison
8. Add save/cancel buttons with notifications

**Completion Criteria:**

- Users can set budgets per category/segment/month
- Progress bar shows actual spending vs target (%)
- Budgets persist correctly to DB
- UI is intuitive (matrix format works well)
- Color coding helps identify over-budget categories
- Month navigation works

**What to verify:**

- Budget grid displays correctly (all categories/segments)
- Percentages calculated accurately
- Dirty cell tracking (only save changed cells)
- Color coding responsive to spending levels
- Can switch between months
- Budgets persist and load correctly

---

### Phase 6: Bank Integration & Settings

Priority: **MEDIUM** - Connection management.

**Tasks:**

1. Create or integrate `src/app/settings/` page (or existing account page)
2. Build `BankConnectionModal.tsx` - goCardless OAuth setup flow
   - "Connect Bank" button → opens modal
   - Redirect to goCardless OAuth
   - Handle callback and token storage
3. Build `ConnectionStatus.tsx` - Show connected bank, account details, last sync time
4. Build `SyncStatus.tsx` - Manual sync button, status message, last sync timestamp
5. Build `DisconnectButton.tsx` - Disconnect with confirmation modal
6. Implement OAuth callback endpoint (`src/app/api/callbacks/gocardless/route.ts`)
7. Add error recovery (retry on token refresh failure)
8. Show sync history/logs (optional: simple list of last 5 syncs)

**Completion Criteria:**

- Users can connect bank via OAuth flow
- Connection status shows clearly (connected/not connected)
- Last sync time displays
- Manual sync button works
- Disconnect works safely (removes tokens)
- Error messages are user-friendly (no token details)
- OAuth callback properly handles success/failure

**What to verify:**

- OAuth redirect works
- Tokens stored encrypted in DB
- Connection status UI updates after connect/disconnect
- Sync button initiates transaction import
- Error recovery retries on token expiration
- No tokens exposed in logs/errors

---

### Phase 7: Polish & Security

Priority: **HIGH** - Before shipping.

**Tasks:**

1. **Security Audit:**
   - ✅ Token encryption verified (no plaintext tokens)
   - ✅ All queries filter by user_id
   - ✅ Error messages don't leak system details
   - ✅ Prepared statements used everywhere (already via sqlClient)
   - ✅ No sensitive data in logs
   - ✅ CORS/CSRF protection on API endpoints
2. Add pagination for transaction lists (100 items per page)
3. Add loading states to all async operations (spinners, disabled buttons)
4. Error boundaries on main pages (transactions, budgets, overview)
5. Mobile responsiveness test (test on phone/tablet)
6. Accessibility review (WCAG 2.1 AA)
   - Color contrast ratios
   - Keyboard navigation
   - Screen reader compatibility
   - Focus indicators
7. Performance optimization:
   - Lazy load charts on overview
   - Memoize expensive computations
   - Cache category/segment data
   - Index queries optimized
8. End-to-end user isolation test (verify user A can't see user B's data)

**Completion Criteria:**

- No security vulnerabilities
- Good performance (charts load < 1s)
- User data properly isolated
- Mobile-friendly
- Accessible (WCAG 2.1 AA)
- All error messages user-friendly

**What to verify:**

- Run security audit checklist
- Test with slow network (3G simulated)
- Test on mobile browser
- Tab through all pages with keyboard only
- Test with screen reader
- Verify user A cannot query user B's data
- Verify all tokens encrypted before storage

---

## Code Patterns & Examples

### Analytics Service Template

```typescript
// src/service/database/analytics/getMonthlyStats.ts
'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  byCategory: Record<UUID, number>;
}

export const getMonthlyStats = async (
  year: number,
  month: number
): Promise<TServerResponse<MonthlyStats>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const result = await sqlClient`
      SELECT
        category_id,
        SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ${auth.userId}
      AND EXTRACT(YEAR FROM transaction_date) = ${year}
      AND EXTRACT(MONTH FROM transaction_date) = ${month}
      GROUP BY category_id
    `;

    const stats: MonthlyStats = {
      totalIncome: 0,
      totalExpense: 0,
      byCategory: {},
    };

    result.forEach((row) => {
      stats.totalIncome += Number(row.income || 0);
      stats.totalExpense += Number(row.expense || 0);
      if (row.category_id) {
        stats.byCategory[row.category_id] = Number(row.expense || 0);
      }
    });

    return {
      status: 200,
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: 'Failed to fetch monthly stats',
    };
  }
};
```

### Zustand Store Template

```typescript
// src/lib/stores/stats/statsStore.ts
'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, subscribeWithSelector } from 'zustand/react';

interface StatsState {
  monthlyStats: MonthlyStats | null;
  trendData: TrendPoint[];
  isLoading: boolean;
  actions: {
    fetchMonthlyStats: (year: number, month: number) => Promise<void>;
    fetchTrendData: (year: number, months: number) => Promise<void>;
  };
}

export const useStatsStore = create<StatsState>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        monthlyStats: null,
        trendData: [],
        isLoading: false,
        actions: {
          fetchMonthlyStats: async (year, month) => {
            set((state) => {
              state.isLoading = true;
            });
            const result = await getMonthlyStats(year, month);
            set((state) => {
              if (result.success) {
                state.monthlyStats = result.data;
              }
              state.isLoading = false;
            });
          },
        },
      }))
    ),
    {
      name: 'stats-store',
      version: 1,
    }
  )
);
```

### Budget Service Template

```typescript
// src/service/database/budgets/saveBudgets.ts
'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

interface BudgetInput {
  categoryId: UUID;
  segmentId: UUID | null;
  year: number;
  month: number;
  targetAmount: number;
}

export const saveBudgets = async (budgets: BudgetInput[]): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    for (const budget of budgets) {
      await sqlClient`
        INSERT INTO budgets (id, user_id, category_id, segment_id, year, month, target_amount)
        VALUES (${crypto.randomUUID()}, ${auth.userId}, ${budget.categoryId}, ${budget.segmentId}, ${budget.year}, ${budget.month}, ${budget.targetAmount})
        ON CONFLICT (user_id, category_id, segment_id, year, month)
        DO UPDATE SET target_amount = ${budget.targetAmount}
      `;
    }

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: 'Failed to save budgets',
    };
  }
};
```

---

## Part 2 File & Directory Structure

After Part 2 completes, full structure includes Part 1 + new additions:

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
│   │   ├── budgets/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── BudgetGrid.tsx
│   │   │       ├── BudgetCell.tsx
│   │   │       ├── BudgetProgress.tsx
│   │   │       ├── BudgetComparison.tsx
│   │   │       └── *.module.css
│   │   ├── settings/ (or integrate to account)
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── BankConnectionModal.tsx
│   │   │       ├── ConnectionStatus.tsx
│   │   │       ├── SyncStatus.tsx
│   │   │       └── DisconnectButton.tsx
│   │   └── layout.tsx (update navigation to include new pages)
│   └── api/
│       └── callbacks/
│           └── gocardless/
│               └── route.ts (new OAuth callback)
├── service/
│   └── database/
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
│       ├── budgets/ (complete)
│       │   ├── budgetsStore.ts
│       │   └── types.ts
│       └── stats/
│           ├── statsStore.ts
│           └── types.ts
```

---

## Environment Variables (Review)

Part 2 uses env vars set up in Part 1:

```
NEXT_PUBLIC_GOCARDLESS_CLIENT_ID
GOCARDLESS_CLIENT_SECRET
NEXT_PUBLIC_GOCARDLESS_REDIRECT_URI
ENCRYPTION_KEY
DATABASE_URL
```

Ensure they are still set.

---

## Key Constraints & Requirements for Part 2

1. **All analytics queries must filter by user_id** - No cross-user data
2. **Budget progress calculation accurate** - Actual vs target percentages
3. **Charts responsive** - Use Recharts with Mantine theme
4. **Settings page secure** - Never display tokens to user
5. **No budget alerts** - Only visual progress indicators (no email/notifications)
6. **Performance** - Charts load within 1 second
7. **Mobile friendly** - All new pages responsive
8. **Accessible** - WCAG 2.1 AA compliance

---

## Part 2 Execution Workflow

Execute **Phases 4, 5, 6, 7 sequentially without stopping:**

1. **Start Phase 4** - Build analytics service and overview dashboard
2. **Verify Phase 4** - Test stats queries and charts
3. **Immediately start Phase 5** - Build budget grids and UI
4. **Verify Phase 5** - Test budget creation, calculation, persistence
5. **Immediately start Phase 6** - Build settings and bank connection
6. **Verify Phase 6** - Test OAuth flow and token management
7. **Immediately start Phase 7** - Security audit and polish
8. **Verify Phase 7** - Test security, performance, accessibility

**Do not stop between phases.** Proceed systematically.

---

## Part 2 Success Checklist - MVP Complete When:

- ✅ Economy overview page shows spending stats and charts
- ✅ Charts render with real transaction data
- ✅ Trends calculated correctly (month-over-month)
- ✅ Budget grid allows setting per category/segment/month
- ✅ Budget progress shows % of target spent
- ✅ Color coding: green < 75%, yellow 75-100%, red > 100%
- ✅ Users can connect bank via OAuth
- ✅ Connection status shows clearly
- ✅ Manual sync button works
- ✅ Disconnect works and removes tokens
- ✅ All data scoped to authenticated user
- ✅ No cross-user data visible
- ✅ Security audit passed (no token leaks, proper isolation)
- ✅ Mobile responsive
- ✅ WCAG 2.1 AA accessibility
- ✅ Good performance (no slow pages)
- ✅ End-to-end MVP working: Sync → View transactions → Set budgets → Review analytics

---

## Notes for Implementation

- **Start with Phase 4** - Get dashboard working with real data
- **Test user isolation constantly** - Verify no cross-user data
- **Handle errors gracefully** - Show user-friendly error messages
- **Use existing patterns** - Reference Part 1 code for consistency
- **Keep charts simple** - Use Recharts' built-in theming
- **Mobile first** - Test on phone/tablet early
- **Performance focus** - Profile charts loading, optimize queries

---

## When Part 2 is Complete

**Report success with:**

- Summary of all 7 phases completed
- Full feature set working (transactions, subscriptions, budgets, analytics, settings)
- Security audit results
- Performance metrics
- Accessibility compliance
- Any known limitations
- MVP ready status

**MVP Complete:** All 7 phases, all features working end-to-end, security reviewed.

---

## Good luck! Execute Phases 4-7 without stopping.

You're the final leg. Reference Part 1 code for patterns. If stuck, check how stats/budgets were designed above.
