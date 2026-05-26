import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'budgy.db');
const SNAPSHOT_DIR = path.join(process.cwd(), 'src/data/snapshot');
const USER_ID = 'default';

const db = new Database(DB_PATH);

function exportTable(table: string, query: string) {
  const rows = db.prepare(query).all(USER_ID);
  const filePath = path.join(SNAPSHOT_DIR, `${table}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} rows → src/data/snapshot/${table}.json`);
}

try {
  exportTable(
    'categories',
    `
    SELECT id, key, label, color, icon, description
    FROM categories WHERE user_id = ? ORDER BY label ASC
  `
  );

  exportTable(
    'segments',
    `
    SELECT id, key, category_key, label, description
    FROM segments WHERE user_id = ? ORDER BY label ASC
  `
  );

  exportTable(
    'companies',
    `
    SELECT id, name, pattern, domain
    FROM companies WHERE user_id = ? ORDER BY name ASC
  `
  );

  exportTable(
    'transactions',
    `
    SELECT id, date, amount, description, raw_description, category_key, segment_key, imported_at
    FROM transactions WHERE user_id = ? ORDER BY date DESC
  `
  );

  exportTable(
    'grafana_dashboards',
    `
    SELECT id, name, url, position
    FROM grafana_dashboards WHERE user_id = ? ORDER BY position ASC
  `
  );

  console.log('Export complete. Commit src/data/snapshot/ to update the deployed snapshot.');
} catch (err) {
  console.error('Export failed:', err);
  process.exit(1);
}
