import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeMobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 기기 연결 상태 추가
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const [sensorData, setSensorData] = useState({
    score: 0,
    statusText: '로딩 중...',
    aiMessage: '데이터를 불러오는 중입니다.',
    temp: 0,
    humi: 0,
    co2: 0,
    noise: 0,
    pm10: 0,
    pm25: 0,
  });

  // 테마 함수에 연결 상태 반영
  const getTheme = (score, isConnected) => {
    if (!isConnected) return { color: '#94A3B8', bg: '#F1F5F9' };
    if (score >= 80) return { color: '#10B981', bg: '#F0FDF4' };
    if (score >= 60) return { color: '#F59E0B', bg: '#FFFBEB' };
    return { color: '#EF4444', bg: '#FEF2F2' };
  };

  const fetchData = async () => {
    try {
      // 1. 프로필 정보 불러오기
      const initialUserName = 'dongdong';
      const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile?userName=${initialUserName}`);
      const settingsResult = await settingsRes.json();
      
      let userSpace = '동아리방';
      if (settingsResult.success && settingsResult.data && settingsResult.data.userSpace) {
        userSpace = settingsResult.data.userSpace;
      }

      // 2. 주 사용공간 파라미터 추가하여 데이터 요청
      const response = await fetch(`${import.meta.env.VITE_API_URL}/home?location=${encodeURIComponent(userSpace)}`);
      const result = await response.json();

      if (result && result.success && result.data) {
        const d = result.data;
        const connected = String(d.deviceStatus || '').includes('연결됨');
        
        setIsDeviceConnected(connected);

        if (connected) {
          setSensorData({
            score: Number(d.score || 0),
            statusText: d.statusLevel || '알 수 없음',
            aiMessage: d.aiMessage || '분석 중인 데이터가 없습니다.',
            temp: Number(d.temperature || 0),
            humi: Number(d.humidity || 0),
            co2: Number(d.co2 || 0),
            noise: Number(d.noise || 0),
            pm10: Number(d.dustPm10 || 0),
            pm25: Number(d.dustPm25 || 0),
          });
        } else {
          setSensorData({
            score: 0,
            statusText: '기기 연결 끊김',
            aiMessage: '기기가 연결되어 있지 않아 데이터를 불러올 수 없습니다.',
            temp: 0,
            humi: 0,
            co2: 0,
            noise: 0,
            pm10: 0,
            pm25: 0,
          });
        }
      } else {
        setIsDeviceConnected(false);
      }
    } catch (e) {
      console.error('데이터 통신 오류:', e);
      setIsDeviceConnected(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const theme = getTheme(sensorData.score, isDeviceConnected);

  const navMenus = [
    { label: '홈', sub: '현재 상태', path: '/' },
    { label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', path: '/analytics' },
    { label: '설정', sub: '환경 설정', path: '/settings' },
  ];

  // 기타 센서 리스트 (PM10, PM2.5만 남김)
  const otherSensors = [
    { icon: '/dust-icon.png', label: '미세먼지', val: isDeviceConnected ? sensorData.pm10 : '--', unit: '㎍/㎥' },
    { icon: '/dustpm-icon.png', label: '초미세먼지', val: isDeviceConnected ? sensorData.pm25 : '--', unit: '㎍/㎥' },
  ];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px', fontFamily: "'Pretendard', sans-serif" }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      {isMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setIsMenuOpen(false)} />
      )}

      {/* 사이드 메뉴 */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: '#111827', zIndex: 1001, transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '16px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
            <span style={{ fontWeight: '700', color: '#FFF' }}>Clean-Sync</span>
          </div>
          <span onClick={() => setIsMenuOpen(false)} style={{ color: '#FFF', fontSize: '24px', cursor: 'pointer' }}>✕</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {navMenus.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div key={menu.path} onClick={() => { navigate(menu.path); setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 20px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer', background: isActive ? 'linear-gradient(90deg, #00A8FF, #0077FF)' : 'transparent', justifyContent: 'center', width: '80%' }}>
                <span style={{ fontSize: '20px' }}>{menu.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>{menu.label}</div>
                  <div style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : '#6B7A99', marginTop: '2px' }}>{menu.sub}</div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
          <span style={{ fontWeight: '700' }}>Clean-Sync</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => setIsMenuOpen(true)}>
          <span style={{ fontWeight: '700', color: theme.color}}>
            {isDeviceConnected ? `● ${sensorData.score}` : '○ Offline'}
          </span>
          <span style={{ fontSize: '24px' }}>☰</span>
        </div>
      </header>

      <div style={{ margin: '20px', backgroundColor: theme.bg, borderRadius: '24px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: '6px', height: '6px', borderRadius: '50%', opacity: 0.3, backgroundColor: theme.color, top: `${Math.random() * 80}%`, left: `${Math.random() * 80}%`, animation: `float ${4 + Math.random() * 4}s infinite ease-in-out` }} />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '15px', color: '#64748B' }}>학습 지수</div>
          <div style={{ fontSize: '72px', fontWeight: '800', color: theme.color, margin: '8px 0', lineHeight: '1'}}>
            {isDeviceConnected ? sensorData.score : '--'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800' }}>
            {sensorData.statusText}
          </div>
          <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '20px', fontSize: '15px', color: '#334155', marginTop: '24px', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            ✨ {sensorData.aiMessage}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '17px', fontWeight: '700', padding: '0 20px', marginBottom: '16px', marginTop: '24px', color: '#1E293B' }}>센서 현황</h2>

     {/* 온도 Block */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px 12px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <img src="/temp-icon.png" alt="온도" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>온도</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: "'DM Mono', monospace" }}>
            {isDeviceConnected ? `${sensorData.temp} °C` : '-- °C'}
          </div>
        </div>
      </div>

      {/* 습도 Block */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px 12px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <img src="/hum-icon.png" alt="습도" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>습도</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: "'DM Mono', monospace" }}>
            {isDeviceConnected ? `${sensorData.humi} %` : '-- %'}
          </div>
        </div>
      </div>

      {/* CO2 Block */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px 12px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <img src="/co2-icon.png" alt="CO2" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>CO₂ 농도</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: "'DM Mono', monospace" }}>
            {isDeviceConnected ? `${sensorData.co2} ppm` : '-- ppm'}
          </div>
        </div>
      </div>

      {/* 소음 Block */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px 12px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <img src="/noise-icon.png" alt="소음" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>소음 수준</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: "'DM Mono', monospace" }}>
            {isDeviceConnected ? `${sensorData.noise} dB` : '-- dB'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '17px', fontWeight: '700', padding: '0 20px', marginBottom: '16px', marginTop: '24px', color: '#1E293B' }}>기타 센서</h2>
      {otherSensors.map((item, i) => (
        <div key={i} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px 12px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <img src={item.icon} alt={item.label} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <div style={{ flex: 1, fontWeight: '600' }}>{item.label}</div>
          <div style={{ fontWeight: '800', fontFamily: "'DM Mono', monospace" }}>
            {item.val}
            {isDeviceConnected ? item.unit : ''}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeMobPage;