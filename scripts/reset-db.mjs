import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), '.pgdata-dev');
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log('Removed ./.pgdata-dev — next server start will initialize a fresh seeded PostgreSQL 18 database.');
} else {
  console.log('No ./.pgdata-dev directory found — already clean.');
}
