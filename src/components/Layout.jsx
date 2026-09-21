import { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpenText,
  ChevronDown,
  CircleDollarSign,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { AppContext } from '../App.jsx';

const navItems = [
  { to: '/', label: '업무 현황', icon: LayoutDashboard, end: true },
  { to: '/applications', label: '신청 목록', icon: ListChecks, end: true },
  { to: '/applications/new', label: '새 신청서', icon: FilePlus2 },
  { to: '/pricing', label: '요금제 참고', icon: BookOpenText },
];

export default function Layout({ children }) {
  const { config, role, actorName, setActorName, changeRole, notice, setNotice } = useContext(AppContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" type="button" aria-label="메뉴 열기" onClick={() => setMobileOpen(true)}>
        <Menu size={21} />
      </button>
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="주 메뉴">
        <div className="brand-block">
          <div className="brand-mark"><Sparkles size={20} /></div>
          <div>
            <strong>AI 예산 허브</strong>
            <span>Planning & Approval</span>
          </div>
          <button className="sidebar-close" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <nav className="primary-nav">
          <span className="nav-label">WORKSPACE</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-policy">
          <CircleDollarSign size={20} />
          <div>
            <strong>개인지원 기준</strong>
            <span>월 1인당 50,000원</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="environment-dot" />
          <span>로컬 SQLite 연결</span>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />}

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            <span>AI 예산 운영</span>
            <span>/</span>
            <strong>{pageTitle(location.pathname)}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="알림"><Bell size={18} /><span className="notification-dot" /></button>
            <div className="role-switcher">
              <div className="avatar">{actorName.slice(0, 1)}</div>
              <label>
                <span className="sr-only">데모 역할</span>
                <select value={role} onChange={(event) => changeRole(event.target.value)} aria-label="데모 역할 전환">
                  {config && Object.entries(config.roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <label className="actor-field">
                <span className="sr-only">처리자 이름</span>
                <input value={actorName} onChange={(event) => setActorName(event.target.value)} aria-label="처리자 이름" />
              </label>
            </div>
          </div>
        </header>
        <main className="page-container">{children}</main>
      </div>

      {notice && (
        <div className={`toast ${notice.type === 'error' ? 'toast-error' : 'toast-success'}`} role="status">
          <span>{notice.message}</span>
          <button type="button" aria-label="알림 닫기" onClick={() => setNotice(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

function pageTitle(pathname) {
  if (pathname === '/') return '업무 현황';
  if (pathname === '/applications') return '신청 목록';
  if (pathname === '/applications/new') return '새 신청서';
  if (pathname.endsWith('/edit')) return '신청서 수정';
  if (pathname.startsWith('/applications/')) return '신청 상세';
  if (pathname === '/pricing') return '요금제 참고';
  return 'AI 예산 허브';
}
