import { useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Calculator, Info, Plus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App.jsx';
import { api } from '../api.js';
import { budgetFor, formatCurrency } from '../utils.js';

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);

const emptyUser = () => ({ name: '', tools: '', monthly_price: '', months: 2, note: '' });
const initialForm = {
  department: '', request_date: today, requester: '', department_head: '',
  use_start: today, use_end: nextMonth, budget_type: '판관비 추경', budget_account: '판관비-지급수수료',
  payment_method: '법인카드(팀 공용)', purpose: '', scope: '', expected_effect: '', limitation_reason: '',
  extended_use_reason: '', users: [emptyUser()],
};

const agreements = [
  '사용 종료 후 2주 이내 실적보고서를 제출합니다.',
  '월 사용량과 결제내역을 신청부서가 관리하고 요청 시 제출합니다.',
  '미사용·저조 시 요금제 하향·해지 후 잔여예산을 반납합니다.',
  '연장 또는 요금제 상향이 필요하면 재신청합니다.',
];

export default function ApplicationFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { setNotice } = useContext(AppContext);
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [accepted, setAccepted] = useState(() => agreements.map(() => false));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/pricing-plans').then(setPlans).catch(() => {});
    if (editing) {
      api(`/applications/${id}`)
        .then((application) => {
          setForm({
            ...Object.fromEntries(Object.keys(initialForm).filter((key) => key !== 'users').map((key) => [key, application[key] ?? ''])),
            users: application.users.map((user) => ({
              name: user.name, tools: user.tools, monthly_price: user.monthly_price, months: user.months, note: user.note,
            })),
          });
          setAccepted(agreements.map(() => true));
        })
        .catch((error) => setNotice({ type: 'error', message: error.message }))
        .finally(() => setLoading(false));
    }
  }, [editing, id, setNotice]);

  const totals = useMemo(() => form.users.reduce((sum, user) => {
    const item = budgetFor(user.monthly_price, user.months);
    return { required: sum.required + item.required, deduction: sum.deduction + item.deduction, additional: sum.additional + item.additional };
  }, { required: 0, deduction: 0, additional: 0 }), [form.users]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setUser = (index, field, value) => setForm((current) => ({
    ...current,
    users: current.users.map((user, userIndex) => userIndex === index ? { ...user, [field]: value } : user),
  }));
  const addUser = () => setForm((current) => ({ ...current, users: [...current.users, emptyUser()] }));
  const removeUser = (index) => setForm((current) => ({ ...current, users: current.users.filter((_, userIndex) => userIndex !== index) }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    if (!accepted.every(Boolean)) {
      setErrors({ agreements: '정산·실적보고 약정을 모두 확인해 주세요.' });
      document.getElementById('agreement-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        users: form.users.map((user) => ({ ...user, monthly_price: Number(user.monthly_price), months: Number(user.months) })),
      };
      const saved = await api(editing ? `/applications/${id}` : '/applications', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setNotice({ type: 'success', message: editing ? '신청서를 수정했습니다.' : `${saved.request_no} 신청서를 저장했습니다.` });
      navigate(`/applications/${saved.id}`);
    } catch (error) {
      setErrors({ ...error.fields, form: error.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state"><span className="spinner" /><p>신청서를 불러오는 중입니다.</p></div>;

  return (
    <form className="page-stack application-form" onSubmit={submit} noValidate>
      <section className="page-heading heading-with-action form-heading">
        <div><Link className="back-link" to={editing ? `/applications/${id}` : '/applications'}><ArrowLeft size={16} />신청 목록</Link><span className="eyebrow">NEW REQUEST</span><h1>{editing ? '신청서 수정' : 'AI 사용예산 신청서'}</h1><p>실결제 예상액과 사용 목적을 구체적으로 작성해 주세요.</p></div>
        <button className="button button-primary" type="submit" disabled={saving}><Save size={18} />{saving ? '저장 중…' : editing ? '변경사항 저장' : '신청서 저장'}</button>
      </section>
      {errors.form && <div className="form-alert" role="alert"><AlertCircle size={19} /><span>{errors.form}</span></div>}

      <FormSection number="01" title="신청 개요" description="예산 귀속과 결제 정보를 입력합니다.">
        <div className="form-grid four-columns">
          <Field label="신청부서" error={errors.department}><input value={form.department} onChange={(e) => setField('department', e.target.value)} placeholder="예: 경영기획팀" /></Field>
          <Field label="신청일" error={errors.request_date}><input type="date" value={form.request_date} onChange={(e) => setField('request_date', e.target.value)} /></Field>
          <Field label="신청자(직위·성명)" error={errors.requester}><input value={form.requester} onChange={(e) => setField('requester', e.target.value)} placeholder="예: 홍길동 대리" /></Field>
          <Field label="부서장" error={errors.department_head}><input value={form.department_head} onChange={(e) => setField('department_head', e.target.value)} placeholder="예: 김부장" /></Field>
          <Field label="사용 시작일" error={errors.use_start}><input type="date" value={form.use_start} onChange={(e) => setField('use_start', e.target.value)} /></Field>
          <Field label="사용 종료일" error={errors.use_end}><input type="date" value={form.use_end} onChange={(e) => setField('use_end', e.target.value)} /></Field>
          <Field label="예산 구분" error={errors.budget_type}><select value={form.budget_type} onChange={(e) => setField('budget_type', e.target.value)}><option>판관비 추경</option><option>부서 기편성예산</option><option>임원 예산</option></select></Field>
          <Field label="예산 계정" error={errors.budget_account}><input value={form.budget_account} onChange={(e) => setField('budget_account', e.target.value)} /></Field>
          <Field label="결제 수단" error={errors.payment_method} span="span-2"><input value={form.payment_method} onChange={(e) => setField('payment_method', e.target.value)} /></Field>
        </div>
        <div className="inline-guidance"><Info size={17} /><span>신규·상향 지원은 <strong>1~2개월 시범 사용</strong>이 원칙이며, 연장·상향 시 재신청이 필요합니다.</span></div>
      </FormSection>

      <FormSection number="02" title="사용 목적 및 기대효과" description="검토자가 판단할 수 있도록 산출물과 효과를 명확히 기술합니다.">
        <div className="form-grid two-columns">
          <Field label="사용 목적 / 만들고자 하는 결과물" error={errors.purpose}><textarea rows="4" value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} placeholder="구체적인 산출물과 활용 방식을 작성해 주세요." /></Field>
          <Field label="적용 업무·범위" error={errors.scope}><textarea rows="4" value={form.scope} onChange={(e) => setField('scope', e.target.value)} placeholder="대상 업무, 인원, 월 처리량 등" /></Field>
          <Field label="기대효과(정량)" error={errors.expected_effect}><textarea rows="4" value={form.expected_effect} onChange={(e) => setField('expected_effect', e.target.value)} placeholder="예: 건당 4시간 → 1시간, 월 45시간 절감" /></Field>
          <Field label="기존 요금제로 불가한 사유" error={errors.limitation_reason}><textarea rows="4" value={form.limitation_reason} onChange={(e) => setField('limitation_reason', e.target.value)} placeholder="사용량 한도, 필요 기능 등 구체적인 사유" /></Field>
        </div>
      </FormSection>

      <FormSection number="03" title="소요 예산 산출" description="사용자 1명을 한 행으로 작성하고 복수 도구는 월 단가를 합산합니다.">
        <datalist id="pricing-options">{plans.map((plan) => <option key={plan.id} value={`${plan.tool} ${plan.plan}`}>{formatCurrency(plan.monthly_price)}</option>)}</datalist>
        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead><tr><th>사용자</th><th>도구·요금제 (복수 입력)</th><th>월 단가 합계</th><th>개월</th><th>소요액</th><th>기지원 차감</th><th>추가 소요액</th><th>비고</th><th><span className="sr-only">삭제</span></th></tr></thead>
            <tbody>
              {form.users.map((user, index) => {
                const budget = budgetFor(user.monthly_price, user.months);
                return (
                  <tr key={index}>
                    <td><label className="sr-only" htmlFor={`user-name-${index}`}>사용자 {index + 1}</label><input id={`user-name-${index}`} value={user.name} onChange={(e) => setUser(index, 'name', e.target.value)} placeholder="직위·성명" /><FieldError message={errors[`users.${index}.name`]} /></td>
                    <td><label className="sr-only" htmlFor={`user-tools-${index}`}>도구·요금제 {index + 1}</label><input id={`user-tools-${index}`} list="pricing-options" value={user.tools} onChange={(e) => setUser(index, 'tools', e.target.value)} placeholder="예: Claude Pro + Cursor Pro" /><FieldError message={errors[`users.${index}.tools`]} /></td>
                    <td><div className="currency-input"><span>₩</span><label className="sr-only" htmlFor={`user-price-${index}`}>월 단가 합계 {index + 1}</label><input id={`user-price-${index}`} type="number" min="0" value={user.monthly_price} onChange={(e) => setUser(index, 'monthly_price', e.target.value)} placeholder="0" /></div><FieldError message={errors[`users.${index}.monthly_price`]} /></td>
                    <td><label className="sr-only" htmlFor={`user-months-${index}`}>사용 개월 {index + 1}</label><input id={`user-months-${index}`} className="months-input" type="number" min="1" max="12" value={user.months} onChange={(e) => setUser(index, 'months', e.target.value)} /><FieldError message={errors[`users.${index}.months`]} /></td>
                    <td className="calculated-cell">{formatCurrency(budget.required)}</td><td className="calculated-cell">− {formatCurrency(budget.deduction)}</td><td className="calculated-cell emphasis">{formatCurrency(budget.additional)}</td>
                    <td><label className="sr-only" htmlFor={`user-note-${index}`}>비고 {index + 1}</label><input id={`user-note-${index}`} value={user.note} onChange={(e) => setUser(index, 'note', e.target.value)} placeholder="사용 용도" /></td>
                    <td><button type="button" className="delete-row" aria-label={`사용자 ${index + 1} 삭제`} disabled={form.users.length === 1} onClick={() => removeUser(index)}><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {errors.users && <p className="field-error">{errors.users}</p>}
        <button className="button button-secondary add-user-button" type="button" onClick={addUser}><Plus size={17} />사용자 추가</button>
        <div className="budget-summary">
          <div><Calculator size={20} /><span>총 소요액<strong>{formatCurrency(totals.required)}</strong></span></div>
          <div className="deduction"><span>기지원 차감<strong>− {formatCurrency(totals.deduction)}</strong></span></div>
          <div className="total"><span>실제 추가 신청액<strong>{formatCurrency(totals.additional)}</strong></span></div>
        </div>
        <p className="calculation-note">기지원 차감 = MIN(소요액, 월 50,000원 × 사용개월). 실제 소요액보다 많이 차감하지 않습니다.</p>
        <Field label="2개월 초과·연간 구독 예외 사유" error={errors.extended_use_reason} optional>
          <textarea rows="3" value={form.extended_use_reason} onChange={(e) => setField('extended_use_reason', e.target.value)} placeholder="2개월을 초과하는 사용자가 있으면 비용상 이점과 필요 사유를 입력하세요." />
        </Field>
      </FormSection>

      <FormSection number="04" title="정산·실적보고 약정" description="신청부서가 이행해야 할 사후관리 원칙입니다." id="agreement-section">
        <div className="agreement-list">
          {agreements.map((agreement, index) => (
            <label key={agreement}><input type="checkbox" checked={accepted[index]} onChange={(e) => setAccepted((current) => current.map((value, itemIndex) => itemIndex === index ? e.target.checked : value))} /><span><strong>{index + 1}</strong>{agreement}</span></label>
          ))}
        </div>
        <FieldError message={errors.agreements} />
      </FormSection>
      <div className="form-footer"><Link className="button button-ghost" to={editing ? `/applications/${id}` : '/applications'}>취소</Link><button className="button button-primary" type="submit" disabled={saving}><Save size={18} />{saving ? '저장 중…' : '신청서 저장'}</button></div>
    </form>
  );
}

function FormSection({ number, title, description, children, id }) {
  return <section className="form-section panel" id={id}><div className="form-section-header"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="form-section-body">{children}</div></section>;
}

function Field({ label, error, optional, span = '', children }) {
  return <label className={`field ${span}`}><span>{label}{optional && <small>선택</small>}</span>{children}<FieldError message={error} /></label>;
}

function FieldError({ message }) {
  return message ? <span className="field-error" role="alert">{message}</span> : null;
}
