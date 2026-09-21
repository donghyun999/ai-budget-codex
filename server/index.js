import { createApp } from './app.js';
import { createDatabase, getDefaultDatabasePath } from './database.js';
import { seedDatabase } from './seed.js';

const port = Number(process.env.PORT || 3001);
const lanMode = process.argv.includes('--lan');
const host = process.env.HOST || (lanMode ? '0.0.0.0' : '127.0.0.1');
const db = createDatabase();
const seedResult = seedDatabase(db);
const app = createApp(db);

const server = app.listen(port, host, () => {
  console.log(`AI 예산 허브가 http://${host}:${port} 에서 실행 중입니다.`);
  if (host === '0.0.0.0') console.log('같은 네트워크의 다른 기기에서는 이 PC의 IPv4 주소로 접속하세요.');
  console.log(`SQLite: ${getDefaultDatabasePath()}`);
  if (seedResult.seeded) console.log('샘플 신청 3건을 생성했습니다.');
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
