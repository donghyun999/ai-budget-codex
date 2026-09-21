export const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currency.format(Number(value || 0));
}

export function formatDate(value, includeTime = false) {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function budgetFor(monthlyPrice, months) {
  const monthly = Math.max(0, Number(monthlyPrice || 0));
  const duration = Math.max(0, Number(months || 0));
  const required = monthly * duration;
  const deduction = Math.min(required, 50000 * duration);
  return { required, deduction, additional: Math.max(0, required - deduction) };
}

export const ROLE_DEFAULTS = {
  APPLICANT: '홍길동 대리 (데모)',
  DEPARTMENT_HEAD: '김부장 (데모)',
  PI_TEAM: '정매니저 (데모)',
  BUDGET_TEAM: '한과장 (데모)',
  EXECUTIVE: '윤상무 (데모)',
};

export const ROLE_STAGE = {
  APPLICANT: [1, 7, 8],
  DEPARTMENT_HEAD: [2],
  PI_TEAM: [3, 4],
  BUDGET_TEAM: [5, 9],
  EXECUTIVE: [6],
};

export function statusTone(status) {
  if (status === '완료' || status === '승인') return 'success';
  if (status === '반려') return 'danger';
  if (status?.includes('구독') || status?.includes('집행')) return 'brand';
  return 'warning';
}
