import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationSchema, formatZodError } from './validation.js';
import {
  createApplication,
  getApplication,
  getDashboard,
  listApplications,
  performAction,
  updateApplication,
} from './repository.js';
import { PERSONAL_SUPPORT_MONTHLY, ROLE_LABELS, STAGES } from './constants.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, database: 'sqlite' }));
  app.get('/api/config', (_req, res) => {
    res.json({
      personalSupportMonthly: PERSONAL_SUPPORT_MONTHLY,
      roles: ROLE_LABELS,
      workflow: STAGES,
      policies: [
        '신규·상향 지원은 1~2개월 시범 사용이 원칙입니다.',
        '연간 구독은 비용상 유리한 경우 예외 사유를 기록해 승인할 수 있습니다.',
        '상위 요금제는 필요 시점에만 사용하고 연중 상시 구독을 지양합니다.',
        '매월 15일까지 PI팀 접수분은 익월 예산에 반영하며 긴급 건은 별도 협의합니다.',
        '사용 종료 후 2주 이내 실적보고를 제출하고 연장·상향 시 재신청합니다.',
      ],
    });
  });
  app.get('/api/pricing-plans', (_req, res) => {
    res.json(db.prepare('SELECT * FROM pricing_plans ORDER BY id').all());
  });
  app.get('/api/dashboard', (_req, res) => res.json(getDashboard(db)));

  app.get('/api/applications', (req, res) => {
    res.json(listApplications(db, { status: req.query.status, search: req.query.search?.trim() }));
  });
  app.post('/api/applications', (req, res) => {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(formatZodError(parsed.error));
    const created = createApplication(db, parsed.data);
    res.status(201).json(created);
  });
  app.get('/api/applications/:id', (req, res) => res.json(getApplication(db, Number(req.params.id))));
  app.put('/api/applications/:id', (req, res) => {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(formatZodError(parsed.error));
    res.json(updateApplication(db, Number(req.params.id), parsed.data));
  });
  app.post('/api/applications/:id/actions', (req, res) => {
    res.json(performAction(db, Number(req.params.id), req.body));
  });

  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((req, res) => res.status(404).json({ message: '요청한 경로를 찾을 수 없습니다.' }));
  app.use((error, _req, res, _next) => {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ message: status >= 500 ? '처리 중 오류가 발생했습니다.' : error.message });
  });
  return app;
}
