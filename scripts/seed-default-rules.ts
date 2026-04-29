import { sqlClient } from '@/service/database/auth/server';

interface DefaultRule {
  pattern: string;
  categoryId: string;
  segmentId: string;
}

const DEFAULT_RULES: DefaultRule[] = [
  // Entertainment/Streaming
  { pattern: 'SPOTIFY%', categoryId: 'entertainment', segmentId: 'streaming' },
  { pattern: 'NETFLIX%', categoryId: 'entertainment', segmentId: 'streaming' },
  { pattern: 'DISNEY+%', categoryId: 'entertainment', segmentId: 'streaming' },
  { pattern: 'HBO%', categoryId: 'entertainment', segmentId: 'streaming' },
  { pattern: 'YOUTUBE%', categoryId: 'entertainment', segmentId: 'streaming' },

  // Transport
  { pattern: 'UBER%', categoryId: 'transport', segmentId: 'rides' },
  { pattern: 'UBER EATS%', categoryId: 'food', segmentId: 'delivery' },
  { pattern: 'LYFT%', categoryId: 'transport', segmentId: 'rides' },
  { pattern: 'DSB%', categoryId: 'transport', segmentId: 'public' },
  { pattern: 'SAS%', categoryId: 'transport', segmentId: 'flights' },
  { pattern: 'RYANAIR%', categoryId: 'transport', segmentId: 'flights' },
  { pattern: 'FLIXBUS%', categoryId: 'transport', segmentId: 'buses' },

  // Food & Dining
  { pattern: 'MCDONALDS%', categoryId: 'food', segmentId: 'restaurants' },
  { pattern: 'BURGER KING%', categoryId: 'food', segmentId: 'restaurants' },
  { pattern: 'STARBUCKS%', categoryId: 'food', segmentId: 'coffee' },
  { pattern: 'WOLT%', categoryId: 'food', segmentId: 'delivery' },
  { pattern: 'JUST EAT%', categoryId: 'food', segmentId: 'delivery' },

  // Shopping
  { pattern: 'AMAZON%', categoryId: 'shopping', segmentId: 'online' },
  { pattern: 'ADIDAS%', categoryId: 'shopping', segmentId: 'clothing' },
  { pattern: 'NIKE%', categoryId: 'shopping', segmentId: 'clothing' },
  { pattern: 'H&M%', categoryId: 'shopping', segmentId: 'clothing' },
  { pattern: 'ZARA%', categoryId: 'shopping', segmentId: 'clothing' },
  { pattern: 'IPHONE%', categoryId: 'shopping', segmentId: 'electronics' },
  { pattern: 'APPLE%', categoryId: 'shopping', segmentId: 'electronics' },

  // Utilities
  { pattern: 'DONG ENERGY%', categoryId: 'utilities', segmentId: 'electricity' },
  { pattern: 'ØRSTED%', categoryId: 'utilities', segmentId: 'electricity' },
  { pattern: 'VAND%', categoryId: 'utilities', segmentId: 'water' },
  { pattern: 'TELIA%', categoryId: 'utilities', segmentId: 'internet' },
  { pattern: 'TELENOR%', categoryId: 'utilities', segmentId: 'phone' },
  { pattern: 'VODAFONE%', categoryId: 'utilities', segmentId: 'phone' },

  // Gyms & Recreation
  { pattern: '%GYM%', categoryId: 'recreation', segmentId: 'fitness' },
  { pattern: '%FITNESS%', categoryId: 'recreation', segmentId: 'fitness' },
  { pattern: 'PLANET FITNESS%', categoryId: 'recreation', segmentId: 'fitness' },

  // Subscriptions
  { pattern: 'MICROSOFT%', categoryId: 'subscription', segmentId: 'software' },
  { pattern: 'ADOBE%', categoryId: 'subscription', segmentId: 'software' },
  { pattern: 'DROPBOX%', categoryId: 'subscription', segmentId: 'storage' },
  { pattern: 'SLACK%', categoryId: 'subscription', segmentId: 'software' },
];

async function seedDefaultRules() {
  try {
    console.log('Starting seed of default categorization rules...');

    for (const rule of DEFAULT_RULES) {
      try {
        await sqlClient`
          INSERT INTO categorization_rules (
            id,
            user_id,
            pattern,
            category_id,
            segment_id,
            priority,
            is_default,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            NULL,
            ${rule.pattern},
            ${rule.categoryId},
            ${rule.segmentId},
            0,
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (user_id, pattern) DO NOTHING;
        `;
        console.log(`✓ Seeded rule: ${rule.pattern}`);
      } catch (error) {
        console.error(`✗ Failed to seed rule: ${rule.pattern}`, error);
      }
    }

    console.log(`✓ Successfully seeded ${DEFAULT_RULES.length} default categorization rules`);
  } catch (error) {
    console.error('Failed to seed default rules:', error);
    process.exit(1);
  }
}

seedDefaultRules();
