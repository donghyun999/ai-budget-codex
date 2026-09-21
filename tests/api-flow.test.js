import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/database.js';

const payload = {
  department: '전략기획팀', request_date: '2026-08-28', requester: '테스트 신청자', department_head: '테스트 부서장',
  use_start: '2026-09-01', use_end: '2026-10-31', budget_type: '판관비 추경', budget_account: '판관비-지급수수료',
  payment_method: '법인카드', purpose: '테스트용 보고서 자동화 도구 구축', scope: '월 20건의 전략 보고서 초안 작성',
  expected_effect: '월 40시간 절감', limitation_reason: '일반 요금제 사용량 한도 부족', extended_use_reason: '',
  users: [
    { name: '사용자 1', tools: 'Claude Max 5x', monthly_price: 150000, months: 2, note: '분석' },
    { name: '사용자 2', tools: 'Claude Pro + Cursor Pro', monthly_price: 60000, months: 2, note: '개발' },
  ],
};

let tempDir;
let databasePath;
let db;
let app;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-budget-test-'));
  databasePath = path.join(tempDir, 'test.db');
  db = createDatabase(databasePath);
  app = createApp(db);
});

afterEach(() => {
  if (db?.open) db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('신청·승인 API', () => {
  it('시나리오 C: 생성부터 최종결정과 처리 이력까지 진행한다', async () => {
    const createdResponse = await request(app).post('/api/applications').send(payload).expect(201);
    const id = createdResponse.body.id;
    expect(createdResponse.body.total_required).toBe(420000);
    expect(createdResponse.body.total_deduction).toBe(200000);
    expect(createdResponse.body.total_additional).toBe(220000);
    expect(createdResponse.body.users).toHaveLength(2);

    const updated = { ...payload, expected_effect: '월 45시간 절감' };
    await request(app).put(`/api/applications/${id}`).send(updated).expect(200).expect((res) => {
      expect(res.body.expected_effect).toBe('월 45시간 절감');
    });

    await action(id, { action: 'DEPARTMENT_APPROVE', actor_role: 'DEPARTMENT_HEAD', actor_name: '부서장', necessity_confirmed: true, personnel_confirmed: true, comment: '승인' }, 3);
    await action(id, { action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', urgent_case: false, comment: '정기 접수' }, 4);
    await action(id, { action: 'PI_REVIEW', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', specific: true, plan_appropriate: true, no_duplicate: true, opinion: '3개 기준 적합' }, 5);
    await action(id, { action: 'BUDGET_REVIEW', actor_role: 'BUDGET_TEAM', actor_name: '예산 담당자', budget_available: true, account_appropriate: true, supplemental_needed: true, opinion: '추경 반영 가능' }, 6);
    const approved = await action(id, { action: 'FINAL_DECISION', actor_role: 'EXECUTIVE', actor_name: '담당 임원', decision: '조건부 승인', comment: '2개월 후 재신청' }, 7);
    expect(approved.final_decision).toBe('조건부 승인');
    expect(approved.history.map((item) => item.result)).toContain('검토 완료');
    expect(approved.history.map((item) => item.result)).toContain('심사 완료');
  });

  it('집행, 실적보고, 정산·반납까지 처리한다', async () => {
    const created = (await request(app).post('/api/applications').send(payload)).body;
    await action(created.id, { action: 'DEPARTMENT_APPROVE', actor_role: 'DEPARTMENT_HEAD', actor_name: '부서장', necessity_confirmed: true, personnel_confirmed: true }, 3);
    await action(created.id, { action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', urgent_case: true, comment: '긴급 협의' }, 4);
    await action(created.id, { action: 'PI_REVIEW', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', specific: true, plan_appropriate: true, no_duplicate: true, opinion: '적합' }, 5);
    await action(created.id, { action: 'BUDGET_REVIEW', actor_role: 'BUDGET_TEAM', actor_name: '예산 담당자', budget_available: true, account_appropriate: true, supplemental_needed: false, opinion: '기편성 예산 사용' }, 6);
    await action(created.id, { action: 'FINAL_DECISION', actor_role: 'EXECUTIVE', actor_name: '임원', decision: '승인', comment: '' }, 7);
    await action(created.id, { action: 'EXECUTION_UPDATE', actor_role: 'APPLICANT', actor_name: '신청자', execution_status: '집행 완료', receipt_reference: '전표-1', monthly_usage_note: '월 사용량 보관', payment_history_note: '결제내역 보관' }, 8);
    await action(created.id, { action: 'PERFORMANCE_REPORT', actor_role: 'APPLICANT', actor_name: '신청자', output: '자동화 보고서', usage: '40건 활용', savings: '월 45시간 절감', continue_use: false }, 9);
    const settled = await request(app).post(`/api/applications/${created.id}/actions`).send({ action: 'SETTLEMENT', actor_role: 'BUDGET_TEAM', actor_name: '예산 담당자', settlement_action: '구독 해지', refund_amount: 30000, comment: '활용 종료 후 해지' }).expect(200);
    expect(settled.body.status).toBe('완료');
    expect(settled.body.settlement_action).toBe('구독 해지');
    expect(settled.body.refund_amount).toBe(30000);
  });

  it('시나리오 D: SQLite 파일을 다시 열어도 값과 상태를 유지한다', async () => {
    const created = (await request(app).post('/api/applications').send(payload).expect(201)).body;
    db.close();
    db = createDatabase(databasePath);
    app = createApp(db);
    const fetched = await request(app).get(`/api/applications/${created.id}`).expect(200);
    expect(fetched.body.requester).toBe(payload.requester);
    expect(fetched.body.total_additional).toBe(220000);
    expect(fetched.body.status).toBe('부서장 승인 대기');
  });

  it('잘못된 입력과 역할·순서 위반을 안전하게 거부한다', async () => {
    await request(app).post('/api/applications').send({ ...payload, users: [{ ...payload.users[0], months: 0 }] }).expect(400);
    const created = (await request(app).post('/api/applications').send(payload)).body;
    await request(app).post(`/api/applications/${created.id}/actions`).send({ action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: 'PI 담당자' }).expect(409);
    await request(app).post(`/api/applications/${created.id}/actions`).send({ action: 'DEPARTMENT_APPROVE', actor_role: 'APPLICANT', actor_name: '신청자', necessity_confirmed: true, personnel_confirmed: true }).expect(403);
  });

  it('최종 승인 단계에서 반려 결정을 저장한다', async () => {
    const created = (await request(app).post('/api/applications').send(payload)).body;
    await advanceToFinal(created.id);
    const rejected = await request(app).post(`/api/applications/${created.id}/actions`).send({
      action: 'FINAL_DECISION', actor_role: 'EXECUTIVE', actor_name: '담당 임원', decision: '반려', comment: '효과 근거 보완 필요',
    }).expect(200);
    expect(rejected.body.status).toBe('반려');
    expect(rejected.body.final_decision).toBe('반려');
    await request(app).post(`/api/applications/${created.id}/actions`).send({ action: 'EXECUTION_UPDATE', actor_role: 'APPLICANT', actor_name: '신청자', execution_status: '구독 준비' }).expect(409);
  });
});

async function action(id, body, expectedStage) {
  const response = await request(app).post(`/api/applications/${id}/actions`).send(body).expect(200);
  expect(response.body.stage).toBe(expectedStage);
  return response.body;
}

async function advanceToFinal(id) {
  await action(id, { action: 'DEPARTMENT_APPROVE', actor_role: 'DEPARTMENT_HEAD', actor_name: '부서장', necessity_confirmed: true, personnel_confirmed: true }, 3);
  await action(id, { action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', urgent_case: false }, 4);
  await action(id, { action: 'PI_REVIEW', actor_role: 'PI_TEAM', actor_name: 'PI 담당자', specific: true, plan_appropriate: true, no_duplicate: true, opinion: '적합' }, 5);
  await action(id, { action: 'BUDGET_REVIEW', actor_role: 'BUDGET_TEAM', actor_name: '예산 담당자', budget_available: true, account_appropriate: true, supplemental_needed: false, opinion: '적합' }, 6);
}
