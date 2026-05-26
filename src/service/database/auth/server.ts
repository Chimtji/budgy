import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'budgy.db');

let _db: any = null;

function getDb() {
  if (_db) return _db;
  // require() prevents static bundling of the native module
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

export function sqlClient(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  if (process.env.READ_ONLY === 'true') {
    return Promise.reject(new Error('Læsetilstand: dataændringer er ikke tilladt'));
  }

  let sql = '';
  const params: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    sql += strings[i];
    if (i < values.length) {
      sql += '?';
      params.push(values[i] ?? null);
    }
  }

  sql = sql.trim();

  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    const upper = sql.trimStart().toUpperCase();

    if (upper.startsWith('SELECT') || upper.includes('RETURNING')) {
      return Promise.resolve(stmt.all(...params));
    }

    stmt.run(...params);
    return Promise.resolve([]);
  } catch (error) {
    return Promise.reject(error);
  }
}
