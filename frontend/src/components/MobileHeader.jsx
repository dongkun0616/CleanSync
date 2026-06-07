import { NavLink } from "react-router-dom";

export default function MobileHeader({ mobileMenuOpen, setMobileMenuOpen, score }) {
  return (
    <>
      <div className="settings-mobile-top">
        <div className="settings-mobile-logo"><div className="settings-mobile-logo-icon">⚡</div><b>Clean-Sync</b></div>
        <div className="settings-mobile-right">
          <span className="settings-mobile-score">● {score}</span>
          <button className="settings-mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="settings-mobile-menu-panel">
          <NavLink to="/home" className={({ isActive }) => `settings-mobile-menu-item ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}><span></span><div><b>홈</b><p>현재 상태</p></div></NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `settings-mobile-menu-item ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}><span></span><div><b>대시보드</b><p>실시간 센서</p></div></NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `settings-mobile-menu-item ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}><span></span><div><b>통계</b><p>기록 분석</p></div></NavLink>
          <NavLink to="/settings" className={({ isActive }) => `settings-mobile-menu-item ${isActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}><span></span><div><b>설정</b><p>환경 설정</p></div></NavLink>
        </div>
      )}
    </>
  );
}