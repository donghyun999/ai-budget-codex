import { calculateBudget, calculateTotals } from './calculations.js';
import { ROLE_LABELS, STAGES } from './constants.js';

const STATUS_BY_STAGE = {
  2: '부서장 승인 대기',
  3: 'PI팀 접수 대기',
  4: 'PI팀 검토 대기',
  5: '예산 심사 대기',
  6: '최종 승인 대기',
  7: '구독·집행',
  8: '실적보고 대기',
  9: '정산·반납 대기',
};

const APPLICATION_FIELDS = [
  'department',
  'request_date',
  'requester',
  'department_head',
  'use_start',
  'use_end',
  'budget_type',
  'budget_account',
  'payment_method',
  'purpose',
  'scope',
  'expected_effect',
  'limitation_reason',
  'extended_use_reason',
];

function nextRequestNo(db, requestDate) {
  const year = requestDate.slice(0, 4);
  const row = db.prepare('SELECT COUNT(*) AS count FROM applications WHERE request_no LIKE ?').get(`AI-${year}-%`);
  return `AI-${year}-${String(row.count + 1).padStart(4, '0')}`;
}

function insertUsers(db, applicationId, users) {
  const insert = db.prepare(`
    INSERT INTO application_users(
      application_id, sort_order, name, tools, monthly_price, months,
      required_amount, deduction_amount, additional_amount, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  users.forEach((user, index) => {
    const budget = calculateBudget(user.monthly_price, user.months);
    insert.run(
      applicationId,
      index + 1,
      user.name,
      user.tools,
      Number(user.monthly_price),
      Number(user.months),
      budget.requiredAmount,
      budget.deductionAmount,
      budget.additionalAmount,
      user.note || '',
    );
  });
}

function addHistory(db, applicationId, stage, actionType, actorRole, actorName, result, comment = '', details = {}) {
  db.prepare(`
    INSERT INTO workflow_history(application_id, stage, action_type, actor_role, actor_name, result, comment, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(applicationId, stage, actionType, actorRole, actorName, result, comment, JSON.stringify(details));
}

export function createApplication(db, input) {
  const transaction = db.transaction(() => {
    const totals = calculateTotals(input.users);
    const requestNo = nextRequestNo(db, input.request_date);
    const values = APPLICATION_FIELDS.map((field) => input[field] ?? '');
    const placeholders = APPLICATION_FIELDS.map(() => '?').join(', ');
    const info = db.prepare(`
      INSERT INTO applications(
        request_no, ${APPLICATION_FIELDS.join(', ')}, stage, status,
        total_required, total_deduction, total_additional
      ) VALUES (?, ${placeholders}, 2, ?, ?, ?, ?)
    `).run(requestNo, ...values, STATUS_BY_STAGE[2], totals.requiredAmount, totals.deductionAmount, totals.additionalAmount);
    insertUsers(db, info.lastInsertRowid, input.users);
    addHistory(db, info.lastInsertRowid, 1, 'CREATE', 'APPLICANT', input.requester, '신청서 작성', '신규 신청서를 작성하고 부서장 승인 단계로 제출했습니다.', {
      totalAdditional: totals.additionalAmount,
    });
    return Number(info.lastInsertRowid);
  });
  return getApplication(db, transaction());
}

export function updateApplication(db, id, input) {
  const current = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!current) throw httpError(404, '신청서를 찾을 수 없습니다.');
  if (current.stage > 2 || current.final_decision) {
    throw httpError(409, '부서장 승인 전 신청서만 수정할 수 있습니다.');
  }
  const transaction = db.transaction(() => {
    const totals = calculateTotals(input.users);
    const assignments = APPLICATION_FIELDS.map((field) => `${field} = ?`).join(', ');
    db.prepare(`
      UPDATE applications SET ${assignments}, total_required = ?, total_deduction = ?, total_additional = ?,
        updated_at = datetime('now', 'localtime') WHERE id = ?
    `).run(...APPLICATION_FIELDS.map((field) => input[field] ?? ''), totals.requiredAmount, totals.deductionAmount, totals.additionalAmount, id);
    db.prepare('DELETE FROM application_users WHERE application_id = ?').run(id);
    insertUsers(db, id, input.users);
    addHistory(db, id, 1, 'UPDATE', 'APPLICANT', input.requester, '신청서 수정', '신청 내용을 수정했습니다.');
  });
  transaction();
  return getApplication(db, id);
}

export function listApplications(db, filters = {}) {
  const where = [];
  const params = [];
  if (filters.status && filters.status !== '전체') {
    where.push('a.status = ?');
    params.push(filters.status);
  }
  if (filters.search) {
    where.push('(a.request_no LIKE ? OR a.department LIKE ? OR a.requester LIKE ? OR a.purpose LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }
  return db.prepare(`
    SELECT a.*, COUNT(u.id) AS user_count
    FROM applications a
    LEFT JOIN application_users u ON u.application_id = a.id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY a.id
    ORDER BY a.id DESC
  `).all(...params);
}

export function getApplication(db, id) {
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!application) throw httpError(404, '신청서를 찾을 수 없습니다.');
  application.users = db.prepare('SELECT * FROM application_users WHERE application_id = ? ORDER BY sort_order').all(id);
  application.history = db
    .prepare('SELECT * FROM workflow_history WHERE application_id = ? ORDER BY id')
    .all(id)
    .map((row) => ({ ...row, details: JSON.parse(row.details_json || '{}') }));
  application.workflow = STAGES;
  return application;
}

function assertStage(application, stage) {
  if (application.stage !== stage || application.status === '반려' || application.status === '완료') {
    throw httpError(409, `현재 단계(${application.status})에서는 이 처리를 수행할 수 없습니다.`);
  }
}

function assertRole(input, role) {
  if (input.actor_role !== role) {
    throw httpError(403, `${ROLE_LABELS[role]} 역할에서만 처리할 수 있습니다.`);
  }
  if (!input.actor_name?.trim()) throw httpError(400, '처리자 이름을 입력해 주세요.');
}

function moveStage(db, id, stage, extraSql = '', params = []) {
  const status = STATUS_BY_STAGE[stage];
  db.prepare(`UPDATE applications SET stage = ?, status = ?, updated_at = datetime('now', 'localtime') ${extraSql} WHERE id = ?`)
    .run(stage, status, ...params, id);
}

export function performAction(db, id, input) {
  const transaction = db.transaction(() => {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!app) throw httpError(404, '신청서를 찾을 수 없습니다.');

    switch (input.action) {
      case 'DEPARTMENT_APPROVE': {
        assertStage(app, 2);
        assertRole(input, 'DEPARTMENT_HEAD');
        if (!input.necessity_confirmed || !input.personnel_confirmed) {
          throw httpError(400, '업무 필요성과 인원 적정성을 모두 확인해야 승인할 수 있습니다.');
        }
        moveStage(db, id, 3);
        addHistory(db, id, 2, input.action, input.actor_role, input.actor_name, '승인', input.comment, {
          necessityConfirmed: true,
          personnelConfirmed: true,
        });
        break;
      }
      case 'PI_RECEIVE': {
        assertStage(app, 3);
        assertRole(input, 'PI_TEAM');
        moveStage(db, id, 4, ', pi_received_at = datetime(\'now\', \'localtime\'), urgent_case = ?, receipt_note = ?', [input.urgent_case ? 1 : 0, input.comment || '']);
        addHistory(db, id, 3, input.action, input.actor_role, input.actor_name, input.urgent_case ? '긴급 접수' : '접수', input.comment, {
          urgentCase: Boolean(input.urgent_case),
          policy: '매월 15일까지 접수분은 익월 예산 반영, 긴급 건은 별도 협의',
        });
        break;
      }
      case 'PI_REVIEW': {
        assertStage(app, 4);
        assertRole(input, 'PI_TEAM');
        const reviewFields = ['specific', 'plan_appropriate', 'no_duplicate'];
        if (reviewFields.some((field) => typeof input[field] !== 'boolean')) {
          throw httpError(400, 'PI 검토 기준 3개를 모두 확인해 주세요.');
        }
        if (!input.opinion?.trim()) throw httpError(400, 'PI 검토의견을 입력해 주세요.');
        moveStage(
          db,
          id,
          5,
          ', pi_specific = ?, pi_plan_appropriate = ?, pi_no_duplicate = ?, pi_opinion = ?, pi_review_date = date(\'now\', \'localtime\'), pi_reviewer = ?',
          [input.specific ? 1 : 0, input.plan_appropriate ? 1 : 0, input.no_duplicate ? 1 : 0, input.opinion, input.actor_name],
        );
        addHistory(db, id, 4, input.action, input.actor_role, input.actor_name, '검토 완료', input.opinion, {
          purposeSpecific: input.specific,
          planAppropriate: input.plan_appropriate,
          noDuplicateSupport: input.no_duplicate,
        });
        break;
      }
      case 'BUDGET_REVIEW': {
        assertStage(app, 5);
        assertRole(input, 'BUDGET_TEAM');
        const reviewFields = ['budget_available', 'account_appropriate', 'supplemental_needed'];
        if (reviewFields.some((field) => typeof input[field] !== 'boolean')) {
          throw httpError(400, '예산 심사 기준 3개를 모두 확인해 주세요.');
        }
        if (!input.opinion?.trim()) throw httpError(400, '예산 심사의견을 입력해 주세요.');
        moveStage(
          db,
          id,
          6,
          ', budget_available = ?, account_appropriate = ?, supplemental_needed = ?, budget_opinion = ?, budget_review_date = date(\'now\', \'localtime\'), budget_reviewer = ?',
          [input.budget_available ? 1 : 0, input.account_appropriate ? 1 : 0, input.supplemental_needed ? 1 : 0, input.opinion, input.actor_name],
        );
        addHistory(db, id, 5, input.action, input.actor_role, input.actor_name, '심사 완료', input.opinion, {
          budgetAvailable: input.budget_available,
          accountAppropriate: input.account_appropriate,
          supplementalNeeded: input.supplemental_needed,
        });
        break;
      }
      case 'FINAL_DECISION': {
        assertStage(app, 6);
        assertRole(input, 'EXECUTIVE');
        if (!['승인', '조건부 승인', '반려'].includes(input.decision)) throw httpError(400, '올바른 최종 결정을 선택해 주세요.');
        if (input.decision === '조건부 승인' && !input.comment?.trim()) throw httpError(400, '조건부 승인 조건을 입력해 주세요.');
        const nextStage = input.decision === '반려' ? 6 : 7;
        const nextStatus = input.decision === '반려' ? '반려' : STATUS_BY_STAGE[7];
        db.prepare(`
          UPDATE applications SET stage = ?, status = ?, final_decision = ?, final_comment = ?,
            final_decision_date = date('now', 'localtime'), final_approver = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(nextStage, nextStatus, input.decision, input.comment || '', input.actor_name, id);
        addHistory(db, id, 6, input.action, input.actor_role, input.actor_name, input.decision, input.comment || '');
        break;
      }
      case 'EXECUTION_UPDATE': {
        assertStage(app, 7);
        assertRole(input, 'APPLICANT');
        if (!['구독 준비', '구독 중', '집행 완료'].includes(input.execution_status)) throw httpError(400, '구독·집행 상태를 선택해 주세요.');
        const completed = input.execution_status === '집행 완료';
        const nextStage = completed ? 8 : 7;
        const nextStatus = completed ? STATUS_BY_STAGE[8] : input.execution_status;
        db.prepare(`
          UPDATE applications SET stage = ?, status = ?, execution_status = ?, receipt_reference = ?,
            monthly_usage_note = ?, payment_history_note = ?, execution_updated_at = datetime('now', 'localtime'),
            updated_at = datetime('now', 'localtime') WHERE id = ?
        `).run(nextStage, nextStatus, input.execution_status, input.receipt_reference || '', input.monthly_usage_note || '', input.payment_history_note || '', id);
        addHistory(db, id, 7, input.action, input.actor_role, input.actor_name, input.execution_status, input.comment || '', {
          receiptReference: input.receipt_reference || '',
          departmentManagesUsageAndPayment: true,
        });
        break;
      }
      case 'PERFORMANCE_REPORT': {
        assertStage(app, 8);
        assertRole(input, 'APPLICANT');
        if (![input.output, input.usage, input.savings].every((value) => value?.trim()) || typeof input.continue_use !== 'boolean') {
          throw httpError(400, '산출물, 활용실적, 절감효과, 계속사용 여부를 모두 입력해 주세요.');
        }
        moveStage(
          db,
          id,
          9,
          ', performance_output = ?, performance_usage = ?, performance_savings = ?, continue_use = ?, performance_reported_at = datetime(\'now\', \'localtime\')',
          [input.output, input.usage, input.savings, input.continue_use ? 1 : 0],
        );
        addHistory(db, id, 8, input.action, input.actor_role, input.actor_name, '실적보고 제출', input.comment || '', {
          continueUse: input.continue_use,
          deadlinePolicy: '사용 종료 후 2주 이내 제출',
        });
        break;
      }
      case 'SETTLEMENT': {
        assertStage(app, 9);
        assertRole(input, 'BUDGET_TEAM');
        if (!['해당 없음', '요금제 하향', '구독 해지', '잔여예산 반납'].includes(input.settlement_action)) {
          throw httpError(400, '정산·후속 조치를 선택해 주세요.');
        }
        const refund = Number(input.refund_amount || 0);
        if (!Number.isInteger(refund) || refund < 0) throw httpError(400, '반납 금액은 0원 이상의 정수여야 합니다.');
        db.prepare(`
          UPDATE applications SET status = '완료', settlement_action = ?, refund_amount = ?, settlement_note = ?,
            settled_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?
        `).run(input.settlement_action, refund, input.comment || '', id);
        addHistory(db, id, 9, input.action, input.actor_role, input.actor_name, input.settlement_action, input.comment || '', { refundAmount: refund });
        break;
      }
      default:
        throw httpError(400, '지원하지 않는 처리 유형입니다.');
    }
  });
  transaction();
  return getApplication(db, id);
}

export function getDashboard(db) {
  const totals = db.prepare(`
    SELECT COUNT(*) AS application_count, COALESCE(SUM(total_additional), 0) AS requested_total,
      SUM(CASE WHEN status IN ('완료', '구독·집행', '구독 준비', '구독 중', '실적보고 대기', '정산·반납 대기') THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN status NOT IN ('완료', '반려') THEN 1 ELSE 0 END) AS active_count
    FROM applications
  `).get();
  const byStatus = db.prepare('SELECT status, COUNT(*) AS count FROM applications GROUP BY status ORDER BY count DESC').all();
  return { ...totals, byStatus };
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export { STATUS_BY_STAGE };
