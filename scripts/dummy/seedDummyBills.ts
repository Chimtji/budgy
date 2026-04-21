import 'dotenv/config';
import { sqlClient } from '@/service/database/auth/server';

const DUMMY_COMPANIES = [
  { name: 'Netflix', domain: 'netflix.com', description: 'Streamingtjeneste' },
  { name: 'Spotify', domain: 'spotify.com', description: 'Musikstreaming' },
  { name: 'Amazon Prime', domain: 'amazon.com', description: 'Shopping & streaming' },
  { name: 'Apple Music', domain: 'apple.com', description: 'Musikstreaming' },
  { name: 'Zoom', domain: 'zoom.us', description: 'Videokonferencer' },
  { name: 'Microsoft 365', domain: 'microsoft.com', description: 'Kontorpakke' },
  { name: 'Adobe Creative Cloud', domain: 'adobe.com', description: 'Designsoftware' },
  { name: 'Dropbox', domain: 'dropbox.com', description: 'Cloudlagring' },
  { name: 'Notion', domain: 'notion.so', description: 'Produktivitetsapp' },
  { name: 'Slack', domain: 'slack.com', description: 'Teamkommunikation' },
];

const CATEGORIES = [
  'home',
  'transport',
  'costOfLiving',
  'experiencesAndLeisure',
  'groceries',
  'savingsAndInvestments',
];

const CATEGORY_SEGMENTS: Record<string, string[]> = {
  home: ['utilities', 'loan', 'insurance', 'maintenance'],
  transport: ['fuel', 'insurance', 'maintenance', 'public'],
  costOfLiving: ['telecom', 'insurance', 'memberships', 'institutions'],
  experiencesAndLeisure: ['streaming', 'software', 'dining', 'fitness'],
  groceries: ['groceries', 'takeaway', 'speciality'],
  savingsAndInvestments: ['pension', 'stocks', 'other'],
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMonths(): number[] {
  const count = Math.floor(Math.random() * 5) + 1;
  const months = new Set<number>();
  while (months.size < count) {
    months.add(Math.floor(Math.random() * 12) + 1);
  }
  return Array.from(months).sort((a, b) => a - b);
}

function getRandomAmount(): number {
  return Math.floor(Math.random() * 1950) + 50;
}

async function seedDummyBills(userId: string, year: number = new Date().getFullYear()) {
  try {
    console.log(`🌱 Seeding 25 dummy bills for user ${userId}...`);

    // Create companies
    console.log('📦 Creating companies...');
    const companies: Array<{ id: number; name: string }> = [];
    for (const company of DUMMY_COMPANIES) {
      try {
        const [result] = await sqlClient`
          INSERT INTO companies (name, domain, description)
          VALUES (${company.name}, ${company.domain}, ${company.description})
          RETURNING id;
        `;
        companies.push({ id: result.id, name: company.name });
        console.log(`  ✓ ${company.name}`);
      } catch (error: any) {
        if (error?.code === '23505') {
          // Unique constraint violation - company already exists, fetch it
          const [existing] = await sqlClient`
            SELECT id FROM companies WHERE name = ${company.name};
          `;
          companies.push({ id: existing.id, name: company.name });
          console.log(`  ✓ ${company.name} (existing)`);
        } else {
          throw error;
        }
      }
    }

    // Create 25 bills
    console.log('💰 Creating 25 bills...');
    let billsCreated = 0;
    for (let i = 0; i < 25; i++) {
      const comp = getRandomElement(companies);
      const category = getRandomElement(CATEGORIES);
      const segments = CATEGORY_SEGMENTS[category];
      const segment = getRandomElement(segments);
      const due = getRandomMonths();
      const amount = getRandomAmount();
      const billName = `${comp.name} - ${segment}`;

      try {
        await sqlClient`
          INSERT INTO bills (amount, company_id, category, segment, due, user_id, year, name)
          VALUES (
            ${amount},
            ${comp.id},
            ${category},
            ${segment},
            ${JSON.stringify(due)},
            ${userId},
            ${year},
            ${billName}
          );
        `;
        billsCreated++;
        console.log(`  ✓ Bill ${i + 1}/25: ${comp.name} - ${segment} (${amount} kr)`);
      } catch (error: any) {
        if (error?.code === '23505') {
          console.log(`  ⊘ Bill ${i + 1}/25: ${comp.name} - ${segment} (skipped, already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Successfully created ${billsCreated} new bills for user ${userId}!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

const userId = process.argv[2];
const year = process.argv[3] ? parseInt(process.argv[3]) : new Date().getFullYear();

if (!userId) {
  console.error('❌ Usage: tsx scripts/dummy/seedDummyBills.ts <user-id> [year]');
  console.error('Example: tsx scripts/dummy/seedDummyBills.ts user-123');
  process.exit(1);
}

seedDummyBills(userId, year).then(() => {
  console.log('\n🎉 Done!');
  process.exit(0);
});
