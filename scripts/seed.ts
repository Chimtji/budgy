import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';
import categories from '../src/data/categories.json';

dotenv.config({ path: '.env' });

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'budgy.db');
const db = new Database(DB_PATH);
const SEED_USER_ID = 'default';

function seed() {
  let categoriesInserted = 0;
  let segmentsInserted = 0;

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, key, label, color, icon, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (key) DO NOTHING
  `);

  const insertSegment = db.prepare(`
    INSERT INTO segments (id, key, category_key, label, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (category_key, key, user_id) DO NOTHING
  `);

  for (const [key, category] of Object.entries(categories)) {
    const cat = category as {
      label: string;
      color: string;
      icon: string;
      description: string;
      segments: Record<string, { label: string; description: string }>;
    };

    const result = insertCategory.run(
      randomUUID(), key, cat.label, cat.color, cat.icon, cat.description, SEED_USER_ID
    );
    if (result.changes > 0) categoriesInserted++;

    for (const [segmentKey, segment] of Object.entries(cat.segments)) {
      const segResult = insertSegment.run(
        randomUUID(), segmentKey, key, segment.label, segment.description, SEED_USER_ID
      );
      if (segResult.changes > 0) segmentsInserted++;
    }
  }

  console.log(`Seeded ${categoriesInserted} categories and ${segmentsInserted} segments.`);
}

try {
  seed();
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
}
