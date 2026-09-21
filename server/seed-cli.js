import { createDatabase, getDefaultDatabasePath } from './database.js';
import { seedDatabase } from './seed.js';

const db = createDatabase();
try {
  const result = seedDatabase(db, { reset: process.argv.includes('--reset') });
  console.log(`${getDefaultDatabasePath()} — ${result.seeded ? `${result.count}건 생성 완료` : `기존 ${result.count}건 유지`}`);
} finally {
  db.close();
}
