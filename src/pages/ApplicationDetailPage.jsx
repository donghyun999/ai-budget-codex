import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, CircleDollarSign, Clock3, FileText, Pencil, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ActionPanel from '../components/ActionPanel.jsx';
import { api } from '../api.js';
import { formatCurrency, formatDate, statusTone } from '../utils.js';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/applications/${id}`).then(setApplication).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="empty-state"><strong>신청서를 불러오지 못했습니다</strong><span>{error}</span><Link className="button button-secondary" to="/applications">목록으로</Link></div>;
  if (!application) return <div className="loading-state"><span className="spinner" /><p>신청 상세를 불러오는 중입니다.</p></div>;

  return (
    <div className="page-stack detail-page">
      <section className="detail-hero">
        <div className="detail-hero-top">
          <div><Link className="back-link" to="/applications"><ArrowLeft size={16} />신청 목록</Link><div className="request-meta"><span>{application.request_no}</span><span>·</span><span>{formatDate(application.request_date)} 신청</span></div><h1>{application.purpose}</h1><p>{application.department} · {application.requester}</p></div>
          <div className="detail-actions"><span className={`status-badge large ${statusTone(application.status)}`}>{application.status}</span>{application.stage <= 2 && !application.final_decision && <Link className="button button-secondary" to={`/applications/${id}/edit`}><Pencil size={16} />수정</Link>}</div>
        </div>
        <div className="detail-kpis">
          <div><CircleDollarSign size={20} /><span>추가 신청액<strong>{formatCurrency(application.total_additional)}</strong></span></div>
          <div><Users size={20} /><span>사용 인원<strong>{application.users.length}명</strong></span></div>
          <div><CalendarDays size={20} /><span>사용 기간<strong>{formatDate(application.use_start)} – {formatDate(application.use_end)}</strong></span></div>
          <div><Clock3 size={20} /><span>현재 단계<strong>{application.stage}. {application.workflow[application.stage - 1].label}</strong></span></div>
        </div>
      </section>

      <section className="workflow-panel panel" aria-label="업무 처리 단계">
        <div className="panel-header"><div><span className="section-kicker">WORKFLOW</span><h2>승인 진행 현황</h2></div><span className="stage-counter">{application.stage} / 9 단계</span></div>
        <div className="workflow-steps">
          {application.workflow.map((step) => {
            const complete = application.status === '완료' || step.number < application.stage;
            const current = step.number === application.stage && application.status !== '완료';
            const rejected = current && application.status === '반려';
            return <div key={step.key} className={`workflow-step ${complete ? 'complete' : ''} ${current ? 'current' : ''} ${rejected ? 'rejected' : ''}`}><div className="step-line" /><div className="step-dot">{complete ? <Check size={14} /> : step.number}</div><strong>{step.label}</strong><span>{step.owner}</span></div>;
          })}
        </div>
      </section>

      <div className="detail-tabs" role="tablist" aria-label="신청 상세 구분">
        {[['overview', '신청 내용'], ['process', '업무 처리'], ['aftercare', '집행·사후관리'], ['history', `처리 이력 ${application.history.length}`]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={activeTab === key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}>{label}</button>)}
      </div>

      {activeTab === 'overview' && <Overview application={application} />}
      {activeTab === 'process' && <section className="panel action-panel-wrap"><ActionPanel application={application} onUpdated={setApplication} /><ReviewSummary application={application} /></section>}
      {activeTab === 'aftercare' && <Aftercare application={application}><ActionPanel application={application} onUpdated={setApplication} /></Aftercare>}
      {activeTab === 'history' && <History application={application} />}
    </div>
  );
}

function Overview({ application }) {
  return (
    <div className="detail-content-grid">
      <div className="detail-main-stack">
        <section className="panel detail-section"><SectionHeading number="01" title="신청 개요" /><div className="description-grid"><Item label="신청부서" value={application.department} /><Item label="신청자" value={application.requester} /><Item label="부서장" value={application.department_head} /><Item label="예산 구분" value={application.budget_type} /><Item label="예산 계정" value={application.budget_account} /><Item label="결제 수단" value={application.payment_method} /><Item label="사용 기간" value={`${formatDate(application.use_start)} – ${formatDate(application.use_end)}`} wide />{application.extended_use_reason && <Item label="장기·연간 사용 예외 사유" value={application.extended_use_reason} wide />}</div></section>
        <section className="panel detail-section"><SectionHeading number="02" title="사용 목적 및 기대효과" /><div className="narrative-grid"><Narrative label="만들고자 하는 결과물" value={application.purpose} /><Narrative label="적용 업무·범위" value={application.scope} /><Narrative label="기대효과(정량)" value={application.expected_effect} /><Narrative label="기존 요금제로 불가한 사유" value={application.limitation_reason} /></div></section>
        <section className="panel detail-section"><SectionHeading number="03" title="사용자별 예산" /><div className="table-scroll"><table className="data-table budget-detail-table"><thead><tr><th>사용자</th><th>도구·요금제</th><th className="align-right">월 단가</th><th className="align-right">개월</th><th className="align-right">소요액</th><th className="align-right">기지원 차감</th><th className="align-right">추가 소요액</th></tr></thead><tbody>{application.users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.note}</small></td><td>{user.tools}</td><td className="align-right">{formatCurrency(user.monthly_price)}</td><td className="align-right">{user.months}</td><td className="align-right">{formatCurrency(user.required_amount)}</td><td className="align-right deduction-text">− {formatCurrency(user.deduction_amount)}</td><td className="align-right amount-cell">{formatCurrency(user.additional_amount)}</td></tr>)}</tbody><tfoot><tr><td colSpan="4">합계</td><td className="align-right">{formatCurrency(application.total_required)}</td><td className="align-right deduction-text">− {formatCurrency(application.total_deduction)}</td><td className="align-right">{formatCurrency(application.total_additional)}</td></tr></tfoot></table></div></section>
      </div>
      <aside className="detail-aside"><section className="amount-card"><span>실제 추가 신청액</span><strong>{formatCurrency(application.total_additional)}</strong><div><span>총 소요액 <b>{formatCurrency(application.total_required)}</b></span><span>기지원 차감 <b>− {formatCurrency(application.total_deduction)}</b></span></div><p>월 1인당 50,000원 개인지원을 차감한 금액입니다.</p></section><section className="panel compact-panel"><h3>사후관리 약정</h3><ul><li>종료 후 2주 이내 실적보고</li><li>부서별 사용량·결제내역 관리</li><li>저조 시 하향·해지·예산 반납</li><li>연장·상향 시 재신청</li></ul></section></aside>
    </div>
  );
}

function ReviewSummary({ application }) {
  const hasReview = application.pi_review_date || application.budget_review_date || application.final_decision;
  if (!hasReview) return null;
  return <div className="review-summary"><h3>검토·결정 기록</h3><div className="review-summary-grid">{application.pi_review_date && <ReviewCard title="PI팀 1차 검토" person={application.pi_reviewer} date={application.pi_review_date} comment={application.pi_opinion} tags={[['목적 구체성', application.pi_specific], ['요금제 적정', application.pi_plan_appropriate], ['중복지원 확인', application.pi_no_duplicate]]} />}{application.budget_review_date && <ReviewCard title="예산 심사" person={application.budget_reviewer} date={application.budget_review_date} comment={application.budget_opinion} tags={[['예산 여력', application.budget_available], ['계정 적정', application.account_appropriate], ['추경 필요', application.supplemental_needed]]} />}{application.final_decision && <ReviewCard title="최종 결정" person={application.final_approver} date={application.final_decision_date} comment={application.final_comment} decision={application.final_decision} />}</div></div>;
}

function Aftercare({ application, children }) {
  const hasData = application.execution_status || application.performance_reported_at || application.settled_at;
  return <div className="aftercare-stack"><section className="panel action-panel-wrap">{[7, 8, 9].includes(application.stage) && !['완료', '반려'].includes(application.status) ? children : <div className="role-gate"><FileText size={22} /><div><strong>사후관리 단계 전입니다</strong><p>최종 승인 후 구독·집행 정보를 관리할 수 있습니다.</p></div></div>}</section>{hasData && <section className="panel detail-section"><SectionHeading number="07–09" title="집행 및 사후관리 기록" /><div className="description-grid"><Item label="집행 상태" value={application.execution_status} /><Item label="영수증·전표" value={application.receipt_reference} /><Item label="월 사용량" value={application.monthly_usage_note} wide /><Item label="결제내역" value={application.payment_history_note} wide /><Item label="산출물" value={application.performance_output} wide /><Item label="활용실적" value={application.performance_usage} wide /><Item label="절감효과" value={application.performance_savings} wide />{application.performance_reported_at && <Item label="계속사용" value={application.continue_use ? '계속사용 (연장 시 재신청)' : '종료'} />}{application.settlement_action && <Item label="정산 조치" value={`${application.settlement_action}${application.refund_amount ? ` · ${formatCurrency(application.refund_amount)}` : ''}`} />}</div></section>}</div>;
}

function History({ application }) {
  return <section className="panel history-panel"><div className="panel-header"><div><span className="section-kicker">AUDIT TRAIL</span><h2>처리 이력</h2></div></div><div className="timeline">{[...application.history].reverse().map((event, index) => <article key={event.id} className="timeline-item"><div className="timeline-marker"><span>{application.history.length - index}</span></div><div className="timeline-card"><div><span className="history-stage">{event.stage}단계</span><strong>{event.result}</strong><time>{formatDate(event.created_at, true)}</time></div><p>{event.comment || '별도 의견 없음'}</p><footer><span>{event.actor_name}</span><span>{event.actor_role}</span></footer></div></article>)}</div></section>;
}

function ReviewCard({ title, person, date, comment, tags, decision }) { return <article><div><strong>{title}</strong>{decision && <span className={`status-badge ${decision === '반려' ? 'danger' : 'success'}`}>{decision}</span>}</div><small>{person} · {formatDate(date)}</small>{tags && <div className="review-tags">{tags.map(([label, value]) => <span className={value ? 'pass' : ''} key={label}>{value ? '✓' : '–'} {label}</span>)}</div>}<p>{comment || '의견 없음'}</p></article>; }
function SectionHeading({ number, title }) { return <div className="section-heading"><span>{number}</span><h2>{title}</h2></div>; }
function Item({ label, value, wide }) { return <div className={`description-item ${wide ? 'wide' : ''}`}><span>{label}</span><strong>{value || '—'}</strong></div>; }
function Narrative({ label, value }) { return <div><span>{label}</span><p>{value}</p></div>; }
