import { useContext, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { AppContext } from '../App.jsx';
import { api } from '../api.js';
import { formatCurrency } from '../utils.js';

const requiredRole = { 2: 'DEPARTMENT_HEAD', 3: 'PI_TEAM', 4: 'PI_TEAM', 5: 'BUDGET_TEAM', 6: 'EXECUTIVE', 7: 'APPLICANT', 8: 'APPLICANT', 9: 'BUDGET_TEAM' };

export default function ActionPanel({ application, onUpdated }) {
  const { config, role, actorName, setNotice } = useContext(AppContext);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setForm(initialForStage(application.stage)), [application.stage, application.id]);

  if (['반려', '완료'].includes(application.status)) {
    return <div className={`terminal-card ${application.status === '반려' ? 'rejected' : ''}`}><CheckCircle2 size={25} /><div><strong>{application.status === '완료' ? '모든 업무가 완료되었습니다' : '반려된 신청입니다'}</strong><p>{application.final_comment || application.settlement_note || '처리 이력에서 상세 결정을 확인할 수 있습니다.'}</p></div></div>;
  }

  const expectedRole = requiredRole[application.stage];
  if (role !== expectedRole) {
    return (
      <div className="role-gate">
        <div className="role-gate-icon"><AlertCircle size={22} /></div>
        <div><strong>{config?.roles[expectedRole]}의 처리를 기다리고 있습니다</strong><p>상단 역할 전환에서 <b>{config?.roles[expectedRole]}</b> 역할을 선택하면 현재 단계 업무를 시연할 수 있습니다.</p></div>
      </div>
    );
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await api(`/applications/${application.id}/actions`, {
        method: 'POST', body: JSON.stringify({ ...form, actor_role: role, actor_name: actorName }),
      });
      setNotice({ type: 'success', message: `${application.status} 업무를 처리했습니다.` });
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="action-form" onSubmit={submit}>
      <div className="action-form-heading"><div><span className="section-kicker">ACTION REQUIRED</span><h3>{actionTitle(application.stage)}</h3><p>{actionDescription(application.stage)}</p></div><span className="actor-chip">처리자 · {actorName}</span></div>
      {error && <div className="form-alert small" role="alert"><AlertCircle size={17} />{error}</div>}
      <StageFields stage={application.stage} form={form} update={update} />
      <div className="action-footer"><span>처리 결과는 이력에 영구 기록됩니다.</span><button className="button button-primary" disabled={submitting} type="submit"><Send size={17} />{submitting ? '처리 중…' : actionButton(application.stage, form)}</button></div>
    </form>
  );
}

function StageFields({ stage, form, update }) {
  if (stage === 2) return <><div className="check-card-grid"><CheckCard checked={form.necessity_confirmed} onChange={(v) => update('necessity_confirmed', v)} title="부서 업무 필요성" text="신청 목적과 실제 부서 업무의 연관성을 확인했습니다." /><CheckCard checked={form.personnel_confirmed} onChange={(v) => update('personnel_confirmed', v)} title="인원 적정성" text="사용 대상자와 인원 규모가 적정함을 확인했습니다." /></div><TextArea label="승인 의견" value={form.comment} onChange={(v) => update('comment', v)} placeholder="승인 근거 또는 참고사항" /></>;
  if (stage === 3) return <><label className="switch-row"><input type="checkbox" checked={form.urgent_case} onChange={(e) => update('urgent_case', e.target.checked)} /><span><strong>긴급 건으로 별도 협의</strong><small>일반 건은 매월 15일까지 접수분을 익월 예산에 반영합니다.</small></span></label><TextArea label="접수 메모" value={form.comment} onChange={(v) => update('comment', v)} placeholder="접수 구분과 예산 반영 시점을 기록하세요." /></>;
  if (stage === 4) return <><div className="review-checklist"><CheckRow checked={form.specific} onChange={(v) => update('specific', v)} label="사용 목적·산출물의 구체성" /><CheckRow checked={form.plan_appropriate} onChange={(v) => update('plan_appropriate', v)} label="요금제 선택의 적정성" /><CheckRow checked={form.no_duplicate} onChange={(v) => update('no_duplicate', v)} label="개인지원 5만원 차감 및 중복지원 여부" /></div><TextArea required label="PI 검토의견" value={form.opinion} onChange={(v) => update('opinion', v)} placeholder="3개 검토 기준에 대한 종합 의견" /></>;
  if (stage === 5) return <><div className="review-checklist"><CheckRow checked={form.budget_available} onChange={(v) => update('budget_available', v)} label="예산 여력 있음" /><CheckRow checked={form.account_appropriate} onChange={(v) => update('account_appropriate', v)} label="예산 계정 적정" /><CheckRow checked={form.supplemental_needed} onChange={(v) => update('supplemental_needed', v)} label="판관비 추경 필요" /></div><TextArea required label="예산 심사의견" value={form.opinion} onChange={(v) => update('opinion', v)} placeholder="예산 재원과 계정 판단 근거" /></>;
  if (stage === 6) return <><fieldset className="decision-options"><legend>최종 결정</legend>{['승인', '조건부 승인', '반려'].map((value) => <label key={value} className={form.decision === value ? 'selected' : ''}><input type="radio" name="decision" value={value} checked={form.decision === value} onChange={() => update('decision', value)} /><span>{value}</span></label>)}</fieldset><TextArea label={form.decision === '조건부 승인' ? '승인 조건 (필수)' : '결정 의견'} value={form.comment} onChange={(v) => update('comment', v)} placeholder="결정 근거와 조건을 기록하세요." /></>;
  if (stage === 7) return <div className="form-grid two-columns"><SelectField label="구독·집행 상태" value={form.execution_status} onChange={(v) => update('execution_status', v)} options={['구독 준비', '구독 중', '집행 완료']} /><TextField label="영수증·전표 참조" value={form.receipt_reference} onChange={(v) => update('receipt_reference', v)} placeholder="예: 법인카드 전표 번호 또는 보관 위치" /><TextArea label="월 사용량 관리" value={form.monthly_usage_note} onChange={(v) => update('monthly_usage_note', v)} placeholder="신청부서가 관리하는 월 사용량" /><TextArea label="결제내역 관리" value={form.payment_history_note} onChange={(v) => update('payment_history_note', v)} placeholder="결제일, 금액, 부서 보관 위치" /><TextArea label="처리 메모" value={form.comment} onChange={(v) => update('comment', v)} placeholder="집행 관련 참고사항" /></div>;
  if (stage === 8) return <div className="form-grid two-columns"><TextArea required label="산출물" value={form.output} onChange={(v) => update('output', v)} placeholder="완성된 산출물 또는 결과" /><TextArea required label="활용실적" value={form.usage} onChange={(v) => update('usage', v)} placeholder="활용 건수와 주요 사용 사례" /><TextArea required label="절감효과" value={form.savings} onChange={(v) => update('savings', v)} placeholder="시간·비용 절감 등 정량 효과" /><fieldset className="continue-options"><legend>계속사용 여부</legend><label><input type="radio" name="continue" checked={form.continue_use === true} onChange={() => update('continue_use', true)} />계속사용</label><label><input type="radio" name="continue" checked={form.continue_use === false} onChange={() => update('continue_use', false)} />종료</label><small>연장·상향이 필요하면 재신청해야 합니다.</small></fieldset></div>;
  if (stage === 9) return <div className="form-grid two-columns"><SelectField label="정산·후속 조치" value={form.settlement_action} onChange={(v) => update('settlement_action', v)} options={['해당 없음', '요금제 하향', '구독 해지', '잔여예산 반납']} /><TextField type="number" min="0" label="잔여예산 반납액" value={form.refund_amount} onChange={(v) => update('refund_amount', v)} placeholder={formatCurrency(0)} /><TextArea label="정산 메모" value={form.comment} onChange={(v) => update('comment', v)} placeholder="저조·미사용 판단 및 조치 내역" /></div>;
  return null;
}

function initialForStage(stage) {
  if (stage === 2) return { action: 'DEPARTMENT_APPROVE', necessity_confirmed: false, personnel_confirmed: false, comment: '' };
  if (stage === 3) return { action: 'PI_RECEIVE', urgent_case: false, comment: '' };
  if (stage === 4) return { action: 'PI_REVIEW', specific: false, plan_appropriate: false, no_duplicate: false, opinion: '' };
  if (stage === 5) return { action: 'BUDGET_REVIEW', budget_available: false, account_appropriate: false, supplemental_needed: false, opinion: '' };
  if (stage === 6) return { action: 'FINAL_DECISION', decision: '승인', comment: '' };
  if (stage === 7) return { action: 'EXECUTION_UPDATE', execution_status: '구독 준비', receipt_reference: '', monthly_usage_note: '', payment_history_note: '', comment: '' };
  if (stage === 8) return { action: 'PERFORMANCE_REPORT', output: '', usage: '', savings: '', continue_use: null, comment: '' };
  if (stage === 9) return { action: 'SETTLEMENT', settlement_action: '해당 없음', refund_amount: 0, comment: '' };
  return {};
}

function actionTitle(stage) { return ['','', '부서장 승인', 'PI팀 신청서 접수', 'PI팀 1차 검토', '경영기획팀 예산 심사', '최종 승인 결정', '구독·집행 정보', '실적보고 제출', '정산·반납 처리'][stage]; }
function actionDescription(stage) { return ['', '', '업무 필요성과 신청 인원의 적정성을 확인합니다.', '접수 기준과 긴급 여부를 확인하고 검토 단계로 이관합니다.', '목적, 요금제, 중복지원 세 가지 기준을 검토합니다.', '예산 여력, 계정 적정성, 추경 필요 여부를 심사합니다.', '승인, 조건부 승인, 반려 중 최종 결정을 기록합니다.', '법인카드 결제와 영수증·월 사용량 관리 내역을 기록합니다.', '사용 종료 후 2주 이내 성과와 계속사용 여부를 보고합니다.', '미사용·저조 여부와 잔여예산 후속 조치를 마감합니다.'][stage]; }
function actionButton(stage, form) { if (stage === 6) return `${form.decision} 처리`; if (stage === 7) return '집행 정보 저장'; if (stage === 8) return '실적보고 제출'; if (stage === 9) return '정산 완료'; return '확인하고 다음 단계로'; }

function CheckCard({ checked, onChange, title, text }) { return <label className={`check-card ${checked ? 'checked' : ''}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="custom-check"><CheckCircle2 size={19} /></span><span><strong>{title}</strong><small>{text}</small></span></label>; }
function CheckRow({ checked, onChange, label }) { return <label><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="custom-check"><CheckCircle2 size={18} /></span><strong>{label}</strong></label>; }
function TextArea({ label, value, onChange, placeholder, required }) { return <label className="field"><span>{label}{required && <b>필수</b>}</span><textarea rows="3" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>; }
function TextField({ label, value, onChange, placeholder, type = 'text', min }) { return <label className="field"><span>{label}</span><input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>; }
function SelectField({ label, value, onChange, options }) { return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
