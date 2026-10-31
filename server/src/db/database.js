import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Initialize default fairness config if missing
  const existingConfig = db.prepare('SELECT id FROM fairness_config WHERE id = 1').get();
  if (!existingConfig) {
    db.prepare(`
      INSERT INTO fairness_config (id, w_wait, w_usage, bonus_academic, bonus_research, bonus_startup, bonus_casual, monthly_hour_cap, cancellation_penalty_threshold, cancellation_block_days)
      VALUES (1, 10.0, 2.0, 30.0, 20.0, 10.0, 0.0, 20.0, 3, 7)
    `).run();
  }
}

