import { useEffect, useState } from 'react';
import { ChevronRight, FileText, Filter, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatCurrency, formatDate, statusTone } from '../utils.js';

const statuses = ['전체', '부서장 승인 대기', 'PI팀 접수 대기', 'PI팀 검토 대기', '예산 심사 대기', '최종 승인 대기', '구독·집행', '구독 중', '실적보고 대기', '정산·반납 대기', '완료', '반려'];

export default function ApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('전체');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== '전체') params.set('status', status);
    if (query) params.set('search', query);
    api(`/applications?${params}`)
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, query]);

  const submitSearch = (event) => {
    event.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div className="page-stack">
      <section className="page-heading heading-with-action">
        <div><span className="eyebrow">APPLICATIONS</span><h1>신청 목록</h1><p>신청 금액과 현재 승인 단계를 조회하고 역할별 업무를 처리합니다.</p></div>
        <Link className="button button-primary" to="/applications/new"><Plus size={18} />새 신청서</Link>
      </section>

      <section className="panel list-panel">
        <div className="list-toolbar">
          <form className="search-box" onSubmit={submitSearch} role="search">
            <Search size={18} />
            <label className="sr-only" htmlFor="application-search">신청 검색</label>
            <input id="application-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="신청번호, 부서, 신청자, 사용 목적 검색" />
            <button type="submit">검색</button>
          </form>
          <label className="filter-select"><Filter size={16} /><span className="sr-only">상태 필터</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="result-summary"><strong>{rows.length}</strong>건의 신청</div>
        {error ? <div className="empty-state"><strong>목록을 불러오지 못했습니다</strong><span>{error}</span></div> : loading ? (
          <div className="loading-state"><span className="spinner" /><p>신청 목록을 불러오는 중입니다.</p></div>
        ) : rows.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>신청번호 / 목적</th><th>신청부서</th><th>신청자</th><th>신청일</th><th className="align-right">추가 신청액</th><th>현재 상태</th><th><span className="sr-only">상세</span></th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td><Link className="primary-cell" to={`/applications/${row.id}`}><span className="file-cell-icon"><FileText size={17} /></span><span><strong>{row.request_no}</strong><small>{row.purpose}</small></span></Link></td>
                    <td>{row.department}</td><td>{row.requester}</td><td>{formatDate(row.request_date)}</td>
                    <td className="align-right amount-cell">{formatCurrency(row.total_additional)}</td>
                    <td><span className={`status-badge ${statusTone(row.status)}`}>{row.status}</span></td>
                    <td><Link className="row-link" aria-label={`${row.request_no} 상세 보기`} to={`/applications/${row.id}`}><ChevronRight size={18} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><FileText size={34} /><strong>조건에 맞는 신청이 없습니다</strong><span>필터를 변경하거나 새 신청서를 작성해 주세요.</span></div>}
      </section>
    </div>
  );
}
