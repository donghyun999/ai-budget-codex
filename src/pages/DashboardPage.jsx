import { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Banknote, CheckCircle2, Clock3, Files, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App.jsx';
import { api } from '../api.js';
import { formatCurrency, formatDate, ROLE_STAGE, statusTone } from '../utils.js';

export default function DashboardPage() {
  const { config, role } = useContext(AppContext);
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/dashboard'), api('/applications')])
      .then(([summary, rows]) => {
        setDashboard(summary);
        setApplications(rows);
      })
      .catch((err) => setError(err.message));
  }, []);

  const myTasks = useMemo(
    () => applications.filter((application) => ROLE_STAGE[role]?.includes(application.stage) && !['완료', '반려'].includes(application.status)),
    [applications, role],
  );

  if (error) return <ErrorState message={error} />;
  if (!dashboard || !config) return <LoadingState />;

  const maxStatus = Math.max(...dashboard.byStatus.map((item) => item.count), 1);

  return (
    <div className="page-stack">
      <section className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">2026 AI BUDGET</span>
          <h1>오늘의 예산 업무를 한눈에</h1>
          <p>{config.roles[role]} 역할에서 처리할 업무와 신청 현황입니다.</p>
        </div>
        <Link className="button button-primary" to="/applications/new"><Plus size={18} />새 신청서</Link>
      </section>

      <section className="kpi-grid" aria-label="신청 요약">
        <Kpi icon={Files} label="전체 신청" value={`${dashboard.application_count}건`} note="SQLite 누적 기준" color="sage" />
        <Kpi icon={Clock3} label="진행 중" value={`${dashboard.active_count}건`} note="현재 처리 필요" color="amber" />
        <Kpi icon={CheckCircle2} label="승인·집행" value={`${dashboard.approved_count}건`} note="최종 승인 이후" color="blue" />
        <Kpi icon={Banknote} label="추가 신청액" value={formatCurrency(dashboard.requested_total)} note="개인지원 차감 후" color="violet" />
      </section>

      <div className="dashboard-grid">
        <section className="panel panel-large">
          <div className="panel-header">
            <div><span className="section-kicker">MY QUEUE</span><h2>내 처리 대기</h2></div>
            <Link className="text-link" to="/applications">전체 보기 <ArrowRight size={15} /></Link>
          </div>
          {myTasks.length ? (
            <div className="task-list">
              {myTasks.slice(0, 4).map((application) => (
                <Link className="task-row" to={`/applications/${application.id}`} key={application.id}>
                  <div className="task-icon"><span>{application.stage}</span></div>
                  <div className="task-main">
                    <div><strong>{application.purpose}</strong><span className={`status-badge ${statusTone(application.status)}`}>{application.status}</span></div>
                    <p>{application.request_no} · {application.department} · {application.requester}</p>
                  </div>
                  <div className="task-amount"><strong>{formatCurrency(application.total_additional)}</strong><span>{formatDate(application.request_date)}</span></div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state compact"><CheckCircle2 size={34} /><strong>현재 처리할 업무가 없습니다</strong><span>역할을 전환해 다른 업무 흐름을 확인할 수 있습니다.</span></div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header"><div><span className="section-kicker">PIPELINE</span><h2>상태별 현황</h2></div><TrendingUp size={20} className="muted-icon" /></div>
          <div className="status-bars">
            {dashboard.byStatus.map((item) => (
              <div className="status-bar" key={item.status}>
                <div><span>{item.status}</span><strong>{item.count}</strong></div>
                <div className="bar-track"><span style={{ width: `${Math.max(12, (item.count / maxStatus) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="policy-strip">
        <div className="policy-title"><span>운영 원칙</span><strong>신청 전에 확인하세요</strong></div>
        <div className="policy-items">
          {config.policies.slice(0, 3).map((policy, index) => <div key={policy}><span>0{index + 1}</span><p>{policy}</p></div>)}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, color }) {
  return <article className="kpi-card"><div className={`kpi-icon ${color}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function LoadingState() {
  return <div className="loading-state"><span className="spinner" /><p>업무 현황을 불러오는 중입니다.</p></div>;
}

function ErrorState({ message }) {
  return <div className="empty-state"><strong>현황을 불러오지 못했습니다</strong><span>{message}</span></div>;
}
