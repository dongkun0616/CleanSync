import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomeData from './HomeData';
import ServerStatus from './ServerStatus';
//ㅇ
function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* 네비게이션 메뉴 */}
        <nav style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '40px', 
          padding: '15px', 
          backgroundColor: '#f1f5f9', 
          borderRadius: '10px' 
        }}>
          <Link to="/home" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold' }}>📊 환경 모니터링</Link>
          <Link to="/test" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold' }}>📡 서버 상태 체크</Link>
        </nav>

        {/* 페이지 경로 설정 */}
        <Routes>
          <Route path="/home" element={<HomeData />} />
          <Route path="/test" element={<ServerStatus />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;