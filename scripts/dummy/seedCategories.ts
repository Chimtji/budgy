import 'dotenv/config';

import { randomUUID } from 'crypto';

import categoriesData from '@/data/categories.json';
import { sqlClient } from '@/service/database/auth/server';

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories and segments...\n');

    // First pass: collect and insert all unique segments
    console.log('📋 Creating segments...');
    const allSegments = new Map<string, { id: string; label: string; description: string }>();

    for (const categoryData of Object.values(categoriesData)) {
      for (const [segmentKey, segmentData] of Object.entries(categoryData.segments)) {
        if (!allSegments.has(segmentKey)) {
          allSegments.set(segmentKey, {
            id: segmentData.id,
            label: segmentData.label,
            description: segmentData.description,
          });
        }
      }
    }

    // Insert all unique segments
    for (const [segmentKey, segmentData] of allSegments.entries()) {
      await sqlClient`
        INSERT INTO segments (id, name, label, description)
        VALUES (
          ${segmentData.id},
          ${segmentKey},
          ${segmentData.label},
          ${segmentData.description}
        )
        ON CONFLICT (name) DO UPDATE SET
          label = EXCLUDED.label,
          description = EXCLUDED.description
        RETURNING id;
      `;
      console.log(`  ✓ ${segmentKey}`);
    }

    console.log('\n📂 Creating categories...');

    // Second pass: insert categories and create many-to-many relationships
    for (const [categoryKey, categoryData] of Object.entries(categoriesData)) {
      const result = await sqlClient`
        INSERT INTO categories (id, name, color, label, image, icon, description)
        VALUES (
          ${categoryData.id},
          ${categoryKey},
          ${categoryData.color},
          ${categoryData.label},
          ${categoryData.image},
          ${categoryData.icon},
          ${categoryData.description}
        )
        ON CONFLICT (name) DO UPDATE SET
          color = EXCLUDED.color,
          label = EXCLUDED.label,
          image = EXCLUDED.image,
          icon = EXCLUDED.icon,
          description = EXCLUDED.description
        RETURNING id;
      `;

      console.log(`  ✓ ${categoryKey}`);

      // Link this category to its segments
      for (const [segmentKey, segmentData] of Object.entries(categoryData.segments)) {
        const segmentId = allSegments.get(segmentKey)?.id || segmentData.id;

        await sqlClient`
          INSERT INTO category_segments (id, category_id, segment_id)
          VALUES (${randomUUID()}, ${categoryData.id}, ${segmentId})
          ON CONFLICT (category_id, segment_id) DO NOTHING;
        `;

        console.log(`    ✓ ${segmentKey}`);
      }
    }

    console.log(`\n✅ Successfully seeded all categories and segments!`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories().then(() => {
  console.log('\n🎉 Done!');
  process.exit(0);
});
