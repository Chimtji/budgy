# GitHub Agent Prompts - Budgy Split Implementation

## Files Created

1. **`GITHUB_AGENT_PROMPT_PART1.md`** - Phases 1-3 (Infrastructure, Transactions, Subscriptions)
2. **`GITHUB_AGENT_PROMPT_PART2.md`** - Phases 4-7 (Analytics, Budgets, Settings, Polish)
3. **`GITHUB_AGENT_PROMPT.md`** - Original full prompt (backup)

---

## How to Use

### Run 1: Part 1 (Phases 1-3)

**Estimated tokens:** ~45-60 requests (safe with your 65 remaining)

1. Copy contents of `/Users/kimac/Develop/budgy/GITHUB_AGENT_PROMPT_PART1.md`
2. Paste into GitHub agent
3. Let it run through all 3 phases without stopping
4. Wait for completion report

**What Part 1 delivers:**

- ✅ Database tables created (transactions, subscriptions, rules, goCardless_requisitions)
- ✅ Token encryption setup
- ✅ goCardless API client working
- ✅ Categorization rules engine functional
- ✅ Transaction import & categorization working
- ✅ Transactions UI (table, detail, bulk operations)
- ✅ Subscription detection & management UI
- ✅ Full end-to-end: Connect bank → Sync → Categorize → Detect subscriptions

---

### Run 2: Part 2 (Phases 4-7)

**Estimated tokens:** ~40-55 requests (safe with new month's credits or if you wait for reset)

1. Once Part 1 completes and reports success
2. Copy contents of `/Users/kimac/Develop/budgy/GITHUB_AGENT_PROMPT_PART2.md`
3. Paste into GitHub agent (new session)
4. Let it run through all 4 phases without stopping
5. Wait for completion report

**What Part 2 delivers:**

- ✅ Economy overview dashboard with charts
- ✅ Spending analytics and trends
- ✅ Budget grid and progress tracking
- ✅ Settings page with bank connection mgmt
- ✅ Security audit & polish
- ✅ Mobile responsive & accessible
- ✅ Full MVP complete

---

## Timeline

**Recommended approach:**

1. **Today:** Run Part 1 with your 65 requests
   - Takes ~50 requests
   - Leaves 15 request buffer for retries/fixes

2. **Wait for monthly reset or buy more credits**

3. **Once you have credits:** Run Part 2

---

## What's Different from Full Prompt

- **Scope:** Split into manageable chunks
- **Token efficiency:** Each part optimized (no redundant explanations)
- **Execution:** Clear stopping points between parts
- **Risk:** Lower chance of hitting token limit mid-implementation

---

## Key Differences in Split Files

### Part 1

- Includes all project context and standards
- Full database schema
- Phases 1-3 only
- Code examples for server actions and stores
- Clear Part 1 success criteria
- Instructions to wait for Part 2

### Part 2

- Prerequisite disclaimer (Part 1 must be done)
- Assumes Part 1 infrastructure exists (no schema creation)
- Phases 4-7 only
- Code examples for analytics and budgets
- Clear Part 2 success criteria
- Final MVP checklist

---

## File Locations

All files in your Budgy repo root:

```
/Users/kimac/Develop/budgy/
├── GITHUB_AGENT_PROMPT_PART1.md          ← Use this first
├── GITHUB_AGENT_PROMPT_PART2.md          ← Use this second
├── GITHUB_AGENT_PROMPT.md                ← Original full (backup)
├── CLAUDE.md
└── ... (rest of project)
```

---

## Verification Steps After Each Run

### After Part 1 Completes

✅ Check database (verify transactions, subscriptions, rules tables exist)
✅ Try syncing transactions from bank
✅ Verify transactions display with categories/segments
✅ Test subscription detection

### After Part 2 Completes

✅ Check overview page shows charts with data
✅ Check budgets grid works
✅ Test bank disconnect/reconnect
✅ Run security audit items
✅ Test on mobile browser

---

## Questions?

- **Part 1 fails?** Fix the issue locally or resume the agent with context
- **Out of tokens mid-Part?** The split approach prevents this as much as possible
- **Want to combine into one file again?** Use the original `GITHUB_AGENT_PROMPT.md`
- **Want to test first?** Consider Phase 1 only as a pilot

---

Ready to go! Copy Part 1 to your agent → Run → Report back when done.
