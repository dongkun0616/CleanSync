import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardMobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sensorData, setSensorData] = useState({
    score: 0, co2: 0, noise: 0, temp: 0, humi: 0, pm10: 0, pm25: 0
  });

  const [lastUpdated, setLastUpdated] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const fetchData = async () => {
    try {
      // .env의 환경 변수 사용
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dashboard`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.success && result.data) {
        const current = result.data.current;
        setSensorData({
          score: Number(current.score || 0),
          co2: Number(current.co2 || 0),
          noise: Number(current.noise || 0),
          temp: Number(current.temperature || 0),
          humi: Number(current.humidity || 0),
          pm10: Number(current.dustPm10 || 0),
          pm25: Number(current.dustPm25 || 0)
        });
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (type, value) => {
    const thresholds = {
      co2: { warn: 800 }, noise: { warn: 50 }, temp: { warn: 28 },
      humi: { warn: 60 }, pm10: { warn: 30 }, pm25: { warn: 15 }
    };
    const isWarning = value > (thresholds[type]?.warn || 100);
    return {
      text: isWarning ? "주의" : "양호",
      color: isWarning ? "#D97706" : "#10B981",
      bgColor: isWarning ? "#FFFBEB" : "#F0F9F4"
    };
  };

  const GaugeBar = ({ value, min, max, color }) => {
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    return (
      <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', marginTop: '10px' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '2px', transition: 'width 0.5s' }} />
      </div>
    );
  };

  const navMenus = [
    { label: '홈', sub: '현재 상태', icon: '🏠', path: '/' },
    { label: '대시보드', sub: '실시간 센서', icon: '📊', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', icon: '📈', path: '/analytics' },
    { label: '설정', sub: '환경 설정', icon: '⚙️', path: '/settings' }
  ];

  const sensors = [
    { key: 'co2', label: 'CO₂', val: sensorData.co2, unit: 'ppm', icon: '💨', range: [400, 1200] },
    { key: 'noise', label: '소음', val: sensorData.noise, unit: 'dB', icon: '🔊', range: [20, 70] },
    { key: 'temp', label: '온도', val: sensorData.temp, unit: '°C', icon: '🌡️', range: [15, 35] },
    { key: 'humi', label: '습도', val: sensorData.humi, unit: '%', icon: '💧', range: [20, 80] },
    { key: 'pm10', label: '미세먼지', val: sensorData.pm10, unit: '㎍/㎥', icon: '☁️', range: [0, 60] },
    { key: 'pm25', label: '초미세먼지', val: sensorData.pm25, unit: '㎍/㎥', icon: '🌫️', range: [0, 50] }
  ];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#FFFFFF', paddingBottom: '20px', fontFamily: "'Pretendard', sans-serif", position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'Pretendard', sans-serif; box-sizing: border-box; }
      `}</style>
      
      {isMenuOpen && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setIsMenuOpen(false)} />}
      
      <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: '#111827', zIndex: 1001, transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '16px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
            <span style={{fontWeight:'700', color: '#FFF'}}>Clean-Sync</span>
          </div>
          <span onClick={() => setIsMenuOpen(false)} style={{ color: '#FFF', fontSize: '24px', cursor: 'pointer' }}>✕</span>
        </div>
        <nav>
          {navMenus.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div key={menu.path} onClick={() => { navigate(menu.path); setIsMenuOpen(false); }} style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 20px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer',
                background: isActive ? 'linear-gradient(90deg, #00A8FF, #0077FF)' : 'transparent'
              }}>
                <span style={{ fontSize: '20px' }}>{menu.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>{menu.label}</div>
                  <div style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : '#6B7A99' }}>{menu.sub}</div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
          <span style={{fontWeight:'700'}}>Clean-Sync</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }} onClick={() => setIsMenuOpen(true)}>
          <span style={{ color: getScoreColor(sensorData.score) }}>● {sensorData.score}</span>
          <span style={{ color: '#161C2D', marginLeft: '8px', fontSize: '18px' }}>☰</span>
        </div>
      </header>

      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#161C2D', margin: '0 0 4px 0' }}>실시간 대시보드</h1>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>모든 센서 수치를 한눈에 비교 분석합니다</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#E6F9F2', color: '#10B981', fontSize: '11px', fontWeight: '700', border: '1px solid #10B981' }}>● LIVE</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#161C2D', fontFamily: "'DM Mono', monospace" }}>{sensorData.score} / 100</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {sensors.map((s, i) => {
            const status = getStatusStyle(s.key, s.val);
            return (
              <div key={i} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16px' }}>{s.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', color: status.color, backgroundColor: status.bgColor }}>{status.text}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#161C2D', fontFamily: "'DM Mono', monospace" }}>
                  {s.val}<span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '2px', fontFamily: "'Pretendard', sans-serif" }}>{s.unit}</span>
                </div>
                <GaugeBar value={s.val} min={s.range[0]} max={s.range[1]} color={status.color} />
              </div>
            );
          })}
        </div>

        <footer style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '30px' }}>
          마지막 업데이트: {lastUpdated}
        </footer>
      </div>
    </div>
  );
};

export default DashboardMobPage;