import { JSONFilePreset } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');

mkdirSync(dataDir, { recursive: true });

const defaultData = {
  networks: {},
  infractions: {},
  tickets: {},
  members: {},
};

let db;

export async function getDb() {
  if (!db) {
    db = await JSONFilePreset(join(dataDir, 'db.json'), defaultData);
  }
  return db;
}

export async function saveDb() {
  const d = await getDb();
  await d.write();
}
