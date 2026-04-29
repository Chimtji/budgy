import crypto from 'crypto';
import { sqlClient } from '@/service/database/auth/server';

// First, you need to get category and segment IDs from your database
// This script assumes you have run the category seed script first

const DEFAULT_RULES = [
  // Subscriptions & Entertainment
  { pattern: 'SPOTIFY', category: 'Underholdning', segment: 'Streaming' },
  { pattern: 'NETFLIX', category: 'Underholdning', segment: 'Streaming' },
  { pattern: 'DISNEY', category: 'Underholdning', segment: 'Streaming' },
  { pattern: '*CINEMA*', category: 'Underholdning', segment: 'Biografe' },
  { pattern: '*GYM*', category: 'Helbred', segment: 'Fitnessstudio' },

  // Food & Groceries
  { pattern: '*SUPERMARKET*', category: 'Mad', segment: 'Dagligvarer' },
  { pattern: '*GROCERY*', category: 'Mad', segment: 'Dagligvarer' },
  { pattern: 'NETTO', category: 'Mad', segment: 'Dagligvarer' },
  { pattern: 'COOP', category: 'Mad', segment: 'Dagligvarer' },
  { pattern: '*RESTAURANT*', category: 'Mad', segment: 'Madbestillinger' },

  // Transport
  { pattern: 'UBER', category: 'Transport', segment: 'Taxier' },
  { pattern: 'DSB', category: 'Transport', segment: 'Tog' },
  { pattern: '*BENZIN*', category: 'Transport', segment: 'Benzin' },

  // Subscriptions (General)
  { pattern: 'MICROSOFT', category: 'Software', segment: 'Abonnementer' },
  { pattern: 'ADOBE', category: 'Software', segment: 'Abonnementer' },

  // Shopping
  { pattern: 'AMAZON', category: 'Shopping', segment: 'Online' },
  { pattern: '*AMAZON*', category: 'Shopping', segment: 'Online' },
];

export async function seedDefaultRules() {
  try {
    console.log('Seeding default categorization rules...');

    // Get category and segment mappings
    const categories = await sqlClient`
      SELECT id, name FROM categories
    `;

    const segments = await sqlClient`
      SELECT id, name FROM segments
    `;

    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
    const segmentMap = new Map(segments.map((s) => [s.name, s.id]));

    let inserted = 0;

    for (const rule of DEFAULT_RULES) {
      const categoryId = categoryMap.get(rule.category);
      const segmentId = segmentMap.get(rule.segment);

      if (!categoryId || !segmentId) {
        console.warn(`Skipping rule for ${rule.pattern}: category or segment not found`);
        continue;
      }

      try {
        await sqlClient`
          INSERT INTO categorization_rules (
            id, user_id, pattern, category_id, segment_id, priority, is_default
          )
          VALUES (
            ${crypto.randomUUID()},
            NULL,
            ${rule.pattern},
            ${categoryId},
            ${segmentId},
            0,
            true
          )
          ON CONFLICT (user_id, pattern) DO NOTHING
        `;

        inserted++;
      } catch (error) {
        console.error(`Failed to insert rule for ${rule.pattern}:`, error);
      }
    }

    console.log(`✓ Seeded ${inserted} default categorization rules`);
  } catch (error) {
    console.error('Failed to seed default rules:', error);
    throw error;
  }
}

// Run the seed function
seedDefaultRules().catch(console.error);
