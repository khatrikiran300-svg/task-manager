import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'tasks.db');

const db = new Database(dbPath);

function createTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

const seedRows = [
  ['Quarterly budget review', 'Prepare slides and variance analysis for finance.', 'pending', '2026-01-15'],
  ['Update employee handbook', 'Incorporate remote-work policy changes.', 'completed', '2026-01-22'],
  ['Client onboarding — Acme Corp', 'Kickoff call, access provisioning, welcome kit.', 'pending', '2026-02-03'],
  ['Renew SSL certificates', 'Prod and staging domains.', 'completed', '2026-02-10'],
  ['Migrate staging DB', 'PostgreSQL 16 upgrade on staging cluster.', 'pending', '2026-02-18'],
  ['Design system audit', 'Review components in Storybook vs Figma.', 'completed', '2026-03-01'],
  ['Hire backend engineer', 'Screen resumes, schedule technical interviews.', 'pending', '2026-03-12'],
  ['API rate-limit tuning', 'Adjust limits after traffic spike analysis.', 'completed', '2026-03-20'],
  ['Security penetration test', 'Coordinate with vendor and fix critical findings.', 'pending', '2026-04-05'],
  ['Q1 marketing campaign', 'Launch email + social for product release.', 'completed', '2026-04-14'],
  ['Refactor auth middleware', 'Reduce duplication across services.', 'pending', '2026-04-28'],
  ['Office lease renewal', 'Negotiate terms with landlord.', 'completed', '2026-05-08'],
  ['Load test checkout flow', 'k6 scripts and Grafana dashboards.', 'pending', '2026-05-19'],
  ['GDPR data export tool', 'Self-service download for user data.', 'completed', '2026-06-02'],
  ['Vendor contract — analytics', 'Legal review and signature.', 'pending', '2026-06-15'],
  ['Summer intern program', 'Post roles and campus outreach.', 'completed', '2026-06-30'],
  ['Mobile app crash triage', 'Prioritize top crashes from Firebase.', 'pending', '2026-07-11'],
  ['Backup restore drill', 'Verify RTO/RPO with ops.', 'completed', '2026-07-24'],
  ['Accessibility WCAG audit', 'Fix keyboard nav on dashboard.', 'pending', '2026-08-07'],
  ['Year-end inventory count', 'Warehouse reconciliation.', 'completed', '2026-12-18'],
];

function insertSeedData() {
  const insert = db.prepare(
    `INSERT INTO tasks (title, description, status, due_date) VALUES (@title, @description, @status, @due_date)`
  );
  const insertMany = db.transaction((rows) => {
    for (const [title, description, status, due_date] of rows) {
      insert.run({ title, description, status, due_date });
    }
  });
  insertMany(seedRows);
}

/**
 * Create table and seed 20 tasks if the table is empty (first app start).
 */
export function initDatabase() {
  createTable();
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  if (count === 0) {
    insertSeedData();
  }
}

/**
 * Drop tasks table, recreate, and insert exactly 20 seed rows (`npm run seed`).
 */
export function seedFresh() {
  db.exec('DROP TABLE IF EXISTS tasks');
  createTable();
  insertSeedData();
}

const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
  seedFresh();
  db.close();
  process.exit(0);
}

export { db };
