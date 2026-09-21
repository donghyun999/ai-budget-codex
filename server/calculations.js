import { PERSONAL_SUPPORT_MONTHLY } from './constants.js';

export function calculateBudget(monthlyPrice, months) {
  const monthly = Number(monthlyPrice);
  const duration = Number(months);
  if (!Number.isFinite(monthly) || monthly < 0) {
    throw new Error('월 단가는 0원 이상의 숫자여야 합니다.');
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 12) {
    throw new Error('사용 개월은 1~12 사이의 정수여야 합니다.');
  }
  const required = Math.round(monthly) * duration;
  const deduction = Math.min(required, PERSONAL_SUPPORT_MONTHLY * duration);
  return {
    requiredAmount: required,
    deductionAmount: deduction,
    additionalAmount: Math.max(0, required - deduction),
  };
}

export function calculateTotals(users) {
  return users.reduce(
    (totals, user) => {
      const budget = calculateBudget(user.monthly_price, user.months);
      totals.requiredAmount += budget.requiredAmount;
      totals.deductionAmount += budget.deductionAmount;
      totals.additionalAmount += budget.additionalAmount;
      return totals;
    },
    { requiredAmount: 0, deductionAmount: 0, additionalAmount: 0 },
  );
}
