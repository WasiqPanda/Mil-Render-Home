import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure the data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'patrol.db'));

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    callsign TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    heading REAL DEFAULT 0,
    batteryLevel INTEGER DEFAULT 100,
    signalStrength INTEGER DEFAULT 100,
    currentTask TEXT,
    lastUpdate TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    reportedBy TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS unit_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(unit_id) REFERENCES units(id)
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hqs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    additionalDetails TEXT,
    operatorId TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(operatorId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    googleId TEXT UNIQUE,
    role TEXT DEFAULT 'patrol_user',
    isApproved INTEGER DEFAULT 0,
    hqId TEXT,
    status TEXT DEFAULT 'pending',
    lastLogin TEXT,
    FOREIGN KEY(hqId) REFERENCES hqs(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    hqId TEXT NOT NULL,
    operatorId TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(hqId) REFERENCES hqs(id),
    FOREIGN KEY(operatorId) REFERENCES users(id)
  );
`);

// Seed initial data if empty (so the app isn't blank on first load)
const unitCount = db.prepare('SELECT count(*) as count FROM units').get() as { count: number };

// Seed app settings if not exists
const settingsCount = db.prepare('SELECT count(*) as count FROM app_settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (@key, @value)');
  insertSetting.run({ key: 'install_date', value: new Date().toISOString() });
  insertSetting.run({ key: 'tier', value: 'free' }); // free, basic, premium
  insertSetting.run({ key: 'expiry_date', value: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }); // 48 hours from now
}

// Seed initial user (admin/admin123) - In production, use bcrypt hash
// For this demo, we'll store it as plain text initially but the auth route will expect hashed.
// Actually, let's just insert a dummy user that will be replaced or handled by the auth route logic.
// We will handle the seeding in server.ts where we have access to bcrypt.


export default db;
