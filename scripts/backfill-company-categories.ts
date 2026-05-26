/**
 * Backfill company default category/segment based on the most common
 * category+segment pair across all transactions linked to each company.
 *
 * Run with: npx tsx scripts/backfill-company-categories.ts
 */
import path from 'path';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'budgy.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

type Row = {
  company_id: string;
  category_key: string;
  segment_key: string;
  count: number;
};

function backfill() {
  // For each company, find the most common (category_key, segment_key) pair
  // excluding uncategorized transactions.
  const rows = db
    .prepare(
      `
      SELECT
        company_id,
        category_key,
        segment_key,
        COUNT(*) AS count
      FROM transactions
      WHERE
        company_id IS NOT NULL
        AND category_key IS NOT NULL
        AND category_key != 'uncategorized'
      GROUP BY company_id, category_key, segment_key
      ORDER BY company_id, count DESC
    `
    )
    .all() as Row[];

  // Keep only the top-ranked pair per company
  const best = new Map<string, { category_key: string; segment_key: string }>();
  for (const row of rows) {
    if (!best.has(row.company_id)) {
      best.set(row.company_id, {
        category_key: row.category_key,
        segment_key: row.segment_key,
      });
    }
  }

  if (best.size === 0) {
    console.log('No categorized transactions with companies found. Nothing to update.');
    return;
  }

  const update = db.prepare(`UPDATE companies SET category_key = ?, segment_key = ? WHERE id = ?`);

  const runAll = db.transaction(() => {
    let updated = 0;
    for (const [company_id, { category_key, segment_key }] of best) {
      const result = update.run(category_key, segment_key, company_id);
      if (result.changes > 0) {
        updated++;
        console.log(`  ✓ ${company_id.slice(0, 8)}…  →  ${category_key} / ${segment_key}`);
      }
    }
    return updated;
  });

  const updated = runAll();
  console.log(`\nDone. Updated ${updated} of ${best.size} companies.`);
}

try {
  backfill();
} catch (err) {
  console.error('Script failed:', err);
  process.exit(1);
}
