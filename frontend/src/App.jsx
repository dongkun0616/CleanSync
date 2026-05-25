import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TablePage from './TablePage';
import StatusPage from './StatusPage';
import DashboardPage from './DashboardPage';
import DashboardMobPage from './DashboardMobPage'; // 1. 모바일 전용 파일 가져오기

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
        
        {/* 2. 감지된 화면 크기에 따라 다른 컴포넌트 렌더링 */}
        <Route 
          path="/dashboard" 
          element={isMobile ? <DashboardMobPage /> : <DashboardPage />} 
        />
      </Routes>
    </Router>
  );
}

export default App;