import { createApplication, performAction } from './repository.js';

const baseApplication = {
  request_date: '2026-07-28',
  use_start: '2026-08-01',
  use_end: '2026-09-30',
  budget_type: '판관비 추경',
  budget_account: '판관비-지급수수료',
  payment_method: '법인카드(팀 공용)',
  extended_use_reason: '',
};

export function seedDatabase(db, { reset = false } = {}) {
  if (reset) {
    db.transaction(() => {
      db.prepare('DELETE FROM workflow_history').run();
      db.prepare('DELETE FROM application_users').run();
      db.prepare('DELETE FROM applications').run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('applications', 'application_users', 'workflow_history')").run();
    })();
  }

  const count = db.prepare('SELECT COUNT(*) AS count FROM applications').get().count;
  if (count > 0) return { seeded: false, count };

  const scenarioA = createApplication(db, {
    ...baseApplication,
    department: '경영기획팀',
    requester: '홍길동 대리 (데모)',
    department_head: '김부장 (데모)',
    purpose: '사업성 판단서 자동화 대시보드 및 사내 공고 분석 도구 개발',
    scope: '사업성 검토 업무, 대상 인원 2명, 월 15건 내외',
    expected_effect: '건당 작성시간 4시간에서 1시간으로 단축, 월 45시간 절감',
    limitation_reason: '일반 요금제 사용량 한도로 코딩 작업이 주 3~4회 중단됨',
    users: [
      { name: '최차장 (데모)', tools: 'Claude Max 5x', monthly_price: 150000, months: 2, note: '바이브코딩 주 사용자' },
      { name: '홍길동 대리 (데모)', tools: 'Claude Pro + Cursor Pro', monthly_price: 60000, months: 2, note: '문서·기획 + 코드 에디터' },
    ],
  });

  const piReview = createApplication(db, {
    ...baseApplication,
    request_date: '2026-08-08',
    department: '고객경험팀',
    requester: '이주임 (데모)',
    department_head: '박팀장 (데모)',
    purpose: '고객 문의 분류와 답변 초안 자동화',
    scope: '월 800건 고객 문의의 분류 및 답변 초안 생성',
    expected_effect: '평균 12분의 1차 응답 준비 시간을 5분으로 단축',
    limitation_reason: '대량 문서 컨텍스트 처리와 팀 공용 프로젝트 기능 필요',
    budget_type: '부서 기편성예산',
    users: [{ name: '이주임 (데모)', tools: 'ChatGPT Pro', monthly_price: 300000, months: 2, note: '고객 문의 분석 담당' }],
  });
  performAction(db, piReview.id, {
    action: 'DEPARTMENT_APPROVE', actor_role: 'DEPARTMENT_HEAD', actor_name: '박팀장 (데모)',
    necessity_confirmed: true, personnel_confirmed: true, comment: '고객 응답 품질과 처리량 개선에 필요합니다.',
  });
  performAction(db, piReview.id, {
    action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: '정매니저 (데모)', urgent_case: false,
    comment: '정기 접수분으로 익월 예산 검토 대상입니다.',
  });

  const execution = createApplication(db, {
    ...baseApplication,
    request_date: '2026-07-10',
    department: '제품개발팀',
    requester: '서연구원 (데모)',
    department_head: '오실장 (데모)',
    purpose: '레거시 코드 마이그레이션 지원 및 테스트 자동 생성',
    scope: '결제 모듈 리팩터링과 단위 테스트 보강',
    expected_effect: '마이그레이션 예상 공수 10인일 절감, 테스트 커버리지 20%p 향상',
    limitation_reason: '일시적으로 대규모 코드베이스 분석이 가능한 상위 요금제가 필요',
    users: [{ name: '서연구원 (데모)', tools: 'Claude Max 5x + Cursor Pro', monthly_price: 180000, months: 1, note: '비상시적 상위 요금제 1개월' }],
  });
  performAction(db, execution.id, {
    action: 'DEPARTMENT_APPROVE', actor_role: 'DEPARTMENT_HEAD', actor_name: '오실장 (데모)', necessity_confirmed: true,
    personnel_confirmed: true, comment: '한시적 마이그레이션 업무에 필요합니다.',
  });
  performAction(db, execution.id, {
    action: 'PI_RECEIVE', actor_role: 'PI_TEAM', actor_name: '정매니저 (데모)', urgent_case: true, comment: '배포 일정상 긴급 건으로 별도 협의 접수합니다.',
  });
  performAction(db, execution.id, {
    action: 'PI_REVIEW', actor_role: 'PI_TEAM', actor_name: '정매니저 (데모)', specific: true, plan_appropriate: true,
    no_duplicate: true, opinion: '목적과 산출물이 구체적이며 1개월 한시 사용이 적정합니다.',
  });
  performAction(db, execution.id, {
    action: 'BUDGET_REVIEW', actor_role: 'BUDGET_TEAM', actor_name: '한과장 (데모)', budget_available: true,
    account_appropriate: true, supplemental_needed: false, opinion: '기편성 지급수수료 예산 내 집행 가능합니다.',
  });
  performAction(db, execution.id, {
    action: 'FINAL_DECISION', actor_role: 'EXECUTIVE', actor_name: '윤상무 (데모)', decision: '조건부 승인',
    comment: '1개월 사용 후 실적을 검토하고 연장 시 재신청하세요.',
  });
  performAction(db, execution.id, {
    action: 'EXECUTION_UPDATE', actor_role: 'APPLICANT', actor_name: '서연구원 (데모)', execution_status: '구독 중',
    receipt_reference: '법인카드 전표 DEMO-0725', monthly_usage_note: '주간 사용량을 팀 대장에 기록 중',
    payment_history_note: '2026-08 180,000원 결제', comment: '영수증과 결제내역은 부서 공유폴더에 보관했습니다.',
  });

  return { seeded: true, count: 3, ids: [scenarioA.id, piReview.id, execution.id] };
}
