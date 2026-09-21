export const PERSONAL_SUPPORT_MONTHLY = 50_000;

export const STAGES = [
  { number: 1, key: 'PLAN', label: '사용계획 수립', owner: '신청부서' },
  { number: 2, key: 'DEPARTMENT_APPROVAL', label: '부서장 승인', owner: '부서장' },
  { number: 3, key: 'PI_RECEIPT', label: 'PI팀 접수', owner: 'PI팀' },
  { number: 4, key: 'PI_REVIEW', label: 'PI팀 1차 검토', owner: 'PI팀' },
  { number: 5, key: 'BUDGET_REVIEW', label: '예산 심사', owner: '경영기획팀' },
  { number: 6, key: 'FINAL_APPROVAL', label: '최종 승인', owner: '담당 임원' },
  { number: 7, key: 'EXECUTION', label: '구독·집행', owner: '신청부서' },
  { number: 8, key: 'PERFORMANCE', label: '실적보고', owner: '신청부서' },
  { number: 9, key: 'SETTLEMENT', label: '정산·반납', owner: '경영기획팀' },
];

export const ROLE_LABELS = {
  APPLICANT: '신청자',
  DEPARTMENT_HEAD: '부서장',
  PI_TEAM: 'PI팀',
  BUDGET_TEAM: '경영기획팀',
  EXECUTIVE: '최종 승인자',
};

export const PRICING_PLANS = [
  ['Claude', 'Pro', 30_000, 300_000, '문서·기획 등 일반 업무'],
  ['Claude', 'Max 5x', 150_000, 1_500_000, '바이브코딩·대량 문서작업 상시 수행자'],
  ['Claude', 'Max 20x', 300_000, 3_000_000, '전사 도구 개발 등 헤비 유저'],
  ['ChatGPT', 'Plus', 30_000, null, '일반 업무 보조'],
  ['ChatGPT', 'Pro', 300_000, null, '리서치·에이전트 헤비 유저'],
  ['Gemini', 'AI Pro', 30_000, null, '구글 워크스페이스 연계 업무'],
  ['Cursor', 'Pro', 30_000, null, '코드 에디터·바이브코딩'],
  ['GitHub Copilot', 'Business', 30_000, null, '코드 자동완성'],
];
