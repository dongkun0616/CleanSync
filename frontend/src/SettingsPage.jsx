import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Utils from './SettingsUtils';
import { AlarmTab, DeviceTab, ProfileTab } from './components/Tabs';
import './SettingsPage.css';

// 파티클 배경 컴포넌트
const ParticleBg = ({ color }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const NUM = 28;
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 5 + 2, dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3, alpha: Math.random() * 0.25 + 0.05,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const hexColor = color.replace('#', '');
        ctx.fillStyle = '#' + hexColor + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [color]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [score] = useState(45);
  const theme = Utils.getTheme(score);
  const statusText = Utils.getStatusText(score);

  const [activeTab, setActiveTab] = useState('alarm');
  const [settings, setSettings] = useState({ emailAlert: true, pushAlert: false, dailyReport: true, weeklyReport: false, co2: 1000, noise: 55, temp: 27, dust: 35 });
  const [devices, setDevices] = useState([{ id: 1, name: '강의실 301호', location: '3층', time: '12:30', status: '연결됨' }]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', location: '' });
  const [profile, setProfile] = useState({ name: '홍길동', email: 'user@example.com', space: '연구실' });
  const [lastUpdate] = useState(new Date());

  const handleSettingChange = (key, val) => setSettings({ ...settings, [key]: val });
  const saveSettings = () => alert('설정이 저장되었습니다.');
  const deleteDevice = (id) => setDevices(devices.filter(d => d.id !== id));
  const addDevice = () => { setDevices([...devices, { ...newDevice, id: Date.now(), time: '방금', status: '연결됨' }]); setShowDeviceModal(false); };
  const handleProfileChange = (key, val) => setProfile({ ...profile, [key]: val });
  const saveProfile = () => alert('프로필이 저장되었습니다.');
  
  const formatTime = (d) => d
    ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
    : '--:--:--';

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;800&display=swap');
        * { font-family: 'Pretendard', sans-serif; }
      `}</style>

      {/* 1. 사이드바 */}
      <aside style={{ width: '230px', minWidth: '230px', height: '100%', background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)', color: '#FFF', padding: '28px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: `0 4px 12px ${theme.color}44` }}>⚡</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Clean-Sync</div>
            <div style={{ fontSize: '10px', color: '#6B7A99', marginTop: '1px' }}>학습 환경 모니터</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7A99', fontWeight: '600' }}>학습 지수</span>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{score}</span>
            <span style={{ fontSize: '14px', color: '#4A5568' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: theme.color, marginTop: '8px' }}>{statusText}</div>
        </div>

       <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}> {/* gap을 조절하여 간격을 넓혔습니다 */}
  {[
    { label: '홈', sub: '현재 상태', path: '/' },
    { label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', path: '/analytics' },
    { label: '설정', sub: '환경 설정', path: '/settings' },
  ].map(({ label, sub, path }) => {
    const isActive = location.pathname === path;
    return (
      <div 
        key={label} 
        onClick={() => navigate(path)} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', // 세로 정렬로 변경
          alignItems: 'center',    // 가로축 가운데 정렬
          justifyContent: 'center',
          padding: '12px 14px', 
          borderRadius: '10px', 
          cursor: 'pointer', 
          background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent', 
          borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent', 
          transition: 'all 0.2s ease',
          textAlign: 'center'      // 텍스트 가운데 정렬
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>
          {label}
        </div>
        <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '4px' }}>
          {sub}
        </div>
      </div>
    );
  })}
</nav>

        <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          마지막 업데이트 {formatTime(lastUpdate)}
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 */}
      <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: theme.bg, padding: '40px', boxSizing: 'border-box' }}>
        <ParticleBg color={theme.color} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A202C', margin: '0 0 20px 0' }}></h1>
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #E2E8F0', marginBottom: '40px' }}>
              <button onClick={() => setActiveTab('alarm')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'alarm' ? '700' : '500', color: activeTab === 'alarm' ? theme.color : '#64748B', borderBottom: activeTab === 'alarm' ? `2px solid ${theme.color}` : 'none' }}>알림 설정</button>
              <button onClick={() => setActiveTab('device')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'device' ? '700' : '500', color: activeTab === 'device' ? theme.color : '#64748B', borderBottom: activeTab === 'device' ? `2px solid ${theme.color}` : 'none' }}>기기 관리</button>
              <button onClick={() => setActiveTab('profile')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'profile' ? '700' : '500', color: activeTab === 'profile' ? theme.color : '#64748B', borderBottom: activeTab === 'profile' ? `2px solid ${theme.color}` : 'none' }}>프로필 정보</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {activeTab === 'alarm' && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '60px' }}>
                <AlarmTab settings={settings} handleSettingChange={handleSettingChange} saveSettings={saveSettings} />
              </div>
            )}
            {activeTab === 'device' && <DeviceTab devices={devices} deleteDevice={deleteDevice} showDeviceModal={showDeviceModal} setShowDeviceModal={setShowDeviceModal} newDevice={newDevice} setNewDevice={setNewDevice} addDevice={addDevice} />}
            {activeTab === 'profile' && <ProfileTab profile={profile} handleProfileChange={handleProfileChange} saveProfile={saveProfile} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;