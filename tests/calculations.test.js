import { describe, expect, it } from 'vitest';
import { calculateBudget, calculateTotals } from '../server/calculations.js';

describe('예산 계산 규칙', () => {
  it('시나리오 A: 작성예시 수준의 2인 신청을 계산한다', () => {
    const first = calculateBudget(150000, 2);
    const second = calculateBudget(60000, 2);
    expect(first).toEqual({ requiredAmount: 300000, deductionAmount: 100000, additionalAmount: 200000 });
    expect(second).toEqual({ requiredAmount: 120000, deductionAmount: 100000, additionalAmount: 20000 });
    expect(calculateTotals([
      { monthly_price: 150000, months: 2 },
      { monthly_price: 60000, months: 2 },
    ])).toEqual({ requiredAmount: 420000, deductionAmount: 200000, additionalAmount: 220000 });
  });

  it('시나리오 B: 소요액이 개인지원 한도보다 작으면 실제 소요액까지만 차감한다', () => {
    expect(calculateBudget(30000, 2)).toEqual({
      requiredAmount: 60000,
      deductionAmount: 60000,
      additionalAmount: 0,
    });
  });

  it('잘못된 금액과 사용개월을 거부한다', () => {
    expect(() => calculateBudget(-1, 2)).toThrow('월 단가');
    expect(() => calculateBudget(30000, 0)).toThrow('사용 개월');
    expect(() => calculateBudget(30000, 13)).toThrow('사용 개월');
  });
});
