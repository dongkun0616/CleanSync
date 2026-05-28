import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 페이지 컴포넌트 import
import HomePage from './HomePage';
import HomeMobPage from './HomeMobPage'; // 👈 파일명과 일치하게 수정!
import DashboardPage from './DashboardPage'; 
import DashboardMobPage from './DashboardMobPage'; 
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <Routes>
        {/* 루트 접속 시 /home으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* 홈 페이지 (수정된 HomeMobPage 컴포넌트 사용) */}
        <Route 
          path="/home" 
          element={isMobile ? <HomeMobPage /> : <HomePage />} 
        />
        
        {/* 대시보드 (모바일 분기 처리) */}
        <Route 
          path="/dashboard" 
          element={isMobile ? <DashboardMobPage /> : <DashboardPage />} 
        />

        {/* 통계 페이지 */}
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* 설정 페이지 */}
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* 잘못된 경로 접근 시 홈으로 이동 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;