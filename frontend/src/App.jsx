import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TablePage from './TablePage';
import StatusPage from './StatusPage';
import DashboardPage from './DashboardPage';
import DashboardMobPage from './DashboardMobPage';
import AnalyticsPage from './AnalyticsPage';
import AnalyticsMobPage from './AnalyticsMobPage';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 화면 크기 변화 감지 리스너
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
        <Route path="/" element={<TablePage />} />
        <Route path="/status" element={<StatusPage />} />
        
        {/* ⭐ 중복된 줄을 지우고, PC/모바일 자동 전환 코드만 하나 남겼습니다! */}
        <Route 
          path="/analytics" 
          element={isMobile ? <AnalyticsMobPage /> : <AnalyticsPage />} 
        />
        
        {/* 대시보드도 정상 작동 */}
        <Route 
          path="/dashboard" 
          element={isMobile ? <DashboardMobPage /> : <DashboardPage />} 
        />
      </Routes>
    </Router>
  );
}

export default App;