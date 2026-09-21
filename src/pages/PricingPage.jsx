import { useContext, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, CircleDollarSign, Info } from 'lucide-react';
import { AppContext } from '../App.jsx';
import { api } from '../api.js';
import { formatCurrency } from '../utils.js';

export default function PricingPage() {
  const { config } = useContext(AppContext);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/pricing-plans').then(setPlans).catch((err) => setError(err.message)); }, []);

  return (
    <div className="page-stack">
      <section className="page-heading"><span className="eyebrow">REFERENCE</span><h1>AI 도구 요금제 참고</h1><p>신청서 작성 시 요금제 선택을 돕는 기준 정보입니다.</p></section>
      <div className="reference-notice"><AlertCircle size={20} /><div><strong>참고 금액이며 실제 결제액이 아닙니다</strong><p>환율·VAT·요금 개정이 반영된 신청 시점의 실결제 예상액을 확인해 입력하세요.</p></div></div>
      <section className="panel pricing-panel">
        {error ? <div className="empty-state"><strong>요금 정보를 불러오지 못했습니다</strong><span>{error}</span></div> : (
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className="pricing-card" key={plan.id}>
                <div className="pricing-brand"><span>{plan.tool.slice(0, 1)}</span><div><strong>{plan.tool}</strong><small>{plan.plan}</small></div></div>
                <div className="pricing-amount"><strong>{formatCurrency(plan.monthly_price)}</strong><span>/ 월</span></div>
                {plan.annual_price && <p className="annual-price">연간 참고 {formatCurrency(plan.annual_price)}</p>}
                <p className="pricing-note">{plan.note}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="policy-card-grid">
        <article><CircleDollarSign size={21} /><strong>개인지원 차감</strong><p>월 1인당 50,000원과 실제 소요액 중 작은 금액을 차감합니다.</p></article>
        <article><CalendarClock size={21} /><strong>시범 사용 원칙</strong><p>신규·상향 지원은 1~2개월 사용 후 실적에 따라 연장 여부를 판단합니다.</p></article>
        <article><Info size={21} /><strong>예외와 재신청</strong><p>연간 구독은 사유를 기록하고, 연장·상향은 사용 종료 전에 재신청합니다.</p></article>
      </div>
      {config && <section className="panel"><div className="panel-header"><div><span className="section-kicker">POLICY</span><h2>운영 원칙 전체</h2></div></div><ul className="policy-list">{config.policies.map((policy) => <li key={policy}>{policy}</li>)}</ul></section>}
    </div>
  );
}
