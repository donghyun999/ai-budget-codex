import { z } from 'zod';

const requiredText = (label, max = 500) =>
  z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}이(가) 너무 깁니다.`);

export const userBudgetSchema = z.object({
  name: requiredText('사용자', 100),
  tools: requiredText('도구·요금제', 300),
  monthly_price: z.coerce.number().int().min(0, '월 단가는 0원 이상이어야 합니다.').max(100_000_000),
  months: z.coerce.number().int().min(1, '사용 개월은 1개월 이상이어야 합니다.').max(12, '사용 개월은 12개월 이하여야 합니다.'),
  note: z.string().trim().max(500).default(''),
});

export const applicationSchema = z
  .object({
    department: requiredText('신청부서', 100),
    request_date: z.string().date('올바른 신청일을 입력해 주세요.'),
    requester: requiredText('신청자', 100),
    department_head: requiredText('부서장', 100),
    use_start: z.string().date('올바른 사용 시작일을 입력해 주세요.'),
    use_end: z.string().date('올바른 사용 종료일을 입력해 주세요.'),
    budget_type: z.enum(['판관비 추경', '부서 기편성예산', '임원 예산']),
    budget_account: requiredText('예산 계정', 100),
    payment_method: requiredText('결제 수단', 100),
    purpose: requiredText('사용 목적', 2000),
    scope: requiredText('적용 업무·범위', 2000),
    expected_effect: requiredText('기대효과', 2000),
    limitation_reason: requiredText('기존 요금제로 불가한 사유', 2000),
    extended_use_reason: z.string().trim().max(2000).default(''),
    users: z.array(userBudgetSchema).min(1, '사용자 예산을 1명 이상 추가해 주세요.').max(50),
  })
  .superRefine((data, ctx) => {
    if (data.use_end < data.use_start) {
      ctx.addIssue({ code: 'custom', path: ['use_end'], message: '사용 종료일은 시작일보다 빠를 수 없습니다.' });
    }
    if (data.users.some((user) => user.months > 2) && !data.extended_use_reason) {
      ctx.addIssue({
        code: 'custom',
        path: ['extended_use_reason'],
        message: '2개월 초과 또는 연간 사용은 예외 사유를 입력해야 합니다.',
      });
    }
  });

export function formatZodError(error) {
  return {
    message: '입력 내용을 확인해 주세요.',
    fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message])),
  };
}
