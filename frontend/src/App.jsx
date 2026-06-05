import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import "./App.css";

import HomePage from "./HomePage";
import HomeMobPage from "./HomeMobPage";
import DashboardPage from "./DashboardPage";
import DashboardMobPage from "./DashboardMobPage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage";

function AppLayout({ isMobile }) {
  return (
    <div className="app">
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>

            <div className="sidebar-logo-text">
              <strong>Clean-Sync</strong>
              <span>학습 환경 모니터</span>
            </div>
          </div>

          <div className="sidebar-score-card">
            <div className="sidebar-score-top">
              <span>학습 지수</span>
              <span className="sidebar-live">● LIVE</span>
            </div>

            <div className="sidebar-score-number">45</div>
            <div className="sidebar-score-status">혼잡</div>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/home" className="sidebar-menu">
              <strong>홈</strong>
              <span>현재 상태</span>
            </NavLink>

            <NavLink to="/dashboard" className="sidebar-menu">
              <strong>대시보드</strong>
              <span>실시간 센서</span>
            </NavLink>

            <NavLink to="/analytics" className="sidebar-menu">
              <strong>통계</strong>
              <span>기록 분석</span>
            </NavLink>

            <NavLink to="/settings" className="sidebar-menu">
              <strong>설정</strong>
              <span>환경 설정</span>
            </NavLink>
          </nav>

          <div className="sidebar-update">마지막 업데이트 02:10:00</div>
        </aside>
      )}

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route
            path="/home"
            element={isMobile ? <HomeMobPage /> : <HomePage />}
          />

          <Route
            path="/dashboard"
            element={isMobile ? <DashboardMobPage /> : <DashboardPage />}
          />

          <Route path="/analytics" element={<AnalyticsPage />} />

          <Route path="/settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <AppLayout isMobile={isMobile} />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;