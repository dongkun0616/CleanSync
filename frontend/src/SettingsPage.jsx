import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
  const initialUserName = 'dongdong'; 
  const locationName = '동아리방';
  
  const getStatusLevel = (score) => {
    if (score >= 90) return "매우 쾌적";
    if (score >= 75) return "쾌적";
    if (score >= 60) return "보통";
    if (score >= 40) return "나쁨";
    return "매우 나쁨";
  };
  
  const [score, setScore] = useState(0);
  const [statusText, setStatusText] = useState('데이터 로딩 중...');

  const [activeTab, setActiveTab] = useState('alarm');
  const [settings, setSettings] = useState({ emailAlert: true, pushAlert: false, dailyReport: true, weeklyReport: false, co2: 1000, noise: 55, temp: 27, dust: 35 });
  const [devices, setDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', location: '' });
  
  const [profile, setProfile] = useState({ userName: '', userEmail: '', userSpace: '' });
  const [isLocked, setIsLocked] = useState(true);
  const [lastUpdate] = useState(new Date());

  // 🚨 기기 연결 상태 판별
  const isConnected = devices.length > 0;

  // 🚨 다른 페이지와 동일한 테마 색상 로직 적용 (OFFLINE 상태 지원)
  const getTheme = (score, isConnected) => {
    if (!isConnected) return { color: '#94A3B8', bg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)' };
    if (score >= 90) return { color: "#059669", bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 75) return { color: "#10B981", bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    if (score >= 60) return { color: "#F59E0B", bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    if (score >= 40) return { color: "#EF4444", bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: "#B91C1C", bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(score, isConnected);

  // 🚨 줌 방지 로직 적용
  useEffect(() => {
    const handleWheel = (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) e.preventDefault(); };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 데이터 불러오기 함수
  const fetchData = async () => {
    try {
      // 1. 환경변수 적용 완료 (GET)
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/settings?userName=${initialUserName}&location=${locationName}`);
      
      if (res.data && res.data.success) {
        const { currentStatus, alerts, devices: deviceData, profile: profileData } = res.data.data;
        
        // 프로필 정보와 알림 설정 화면에 반영
        setSettings({
          emailAlert: alerts.emailAlertEnabled,
          pushAlert: alerts.pushAlertEnabled,
          dailyReport: alerts.dailyReportEnabled,
          weeklyReport: alerts.weeklyReportEnabled,
          co2: alerts.co2Threshold,
          noise: alerts.noiseThreshold,
          temp: alerts.temperatureThreshold,
          dust: alerts.dustThreshold
        });
        
        setProfile({
          userName: profileData.userName || initialUserName,
          userEmail: profileData.userEmail || '',
          userSpace: profileData.userSpace || ''
        });

        // 잠금 상태(isLocked) 결정: 프로필이 있고, 기기도 연결되어 있어야 알림 설정 가능
        const hasProfile = profileData.userName && profileData.userEmail;
        const hasDevice = deviceData && deviceData.deviceName;

        if (hasProfile && hasDevice) {
          setIsLocked(false);
        } else {
          setIsLocked(true);
        }

        // 기기 데이터가 없는 경우의 처리
        if (!hasDevice) {
            setDevices([]);
            setScore(0);
            setStatusText("기기 미연결");
            return; 
        }

        // 기기가 있는 경우의 처리
        const currentScore = Number(currentStatus.spaceScore || 0);
        setScore(currentScore);
        setStatusText(getStatusLevel(currentScore));

        const formattedDevices = [{
          id: 1, 
          name: deviceData.deviceName,
          status: deviceData.deviceStatus || '연결안됨',
          lastConnected: deviceData.lastConnected || '없음'
        }];
        setDevices(formattedDevices);
      }
    } catch (err) {
      console.error("데이터를 가져오는 중 에러 발생", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleDeviceStatus = async (currentStatus) => {
    const newStatus = currentStatus === '연결됨' ? '연결안됨' : '연결됨';
    try {
      // 2. 환경변수 적용 완료 (PUT - 기기 상태)
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/settings/devices`, {
        userName: initialUserName,
        deviceName: devices[0]?.name || '내 기기',
        deviceStatus: newStatus
      });
      if (res.data.success) {
        fetchData();
        alert(`기기 상태가 ${newStatus}로 변경되었습니다.`);
      }
    } catch (err) {
      console.error("기기 상태 변경 에러", err);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleSettingChange = (key, val) => {
    if (isLocked) {
      alert("기기가 등록되어 있고, 프로필 정보가 저장되어야 알림을 설정할 수 있습니다.");
      return;
    }
    setSettings({ ...settings, [key]: val });
  };

  const saveSettings = async () => {
    if (isLocked) {
      alert("기기가 등록되어 있고, 프로필 정보가 저장되어야 알림을 설정할 수 있습니다.");
      return;
    }
    try {
      const payload = {
        emailAlertEnabled: settings.emailAlert,
        pushAlertEnabled: settings.pushAlert,
        dailyReportEnabled: settings.dailyReport,
        weeklyReportEnabled: settings.weeklyReport,
        co2Threshold: settings.co2,
        noiseThreshold: settings.noise,
        temperatureThreshold: settings.temp,
        dustThreshold: settings.dust,
        userName: profile.userName
      };
      
      // 3. 환경변수 적용 완료 (PUT - 알림 설정)
      await axios.put(`${process.env.REACT_APP_API_URL}/settings/alerts`, payload);
      alert('설정이 저장되었습니다.');
      fetchData();
    } catch (err) {
      console.error("설정 저장 에러", err);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const deleteDevice = async (deviceId) => {
    try {
      // 4. 환경변수 적용 완료 (DELETE - 기기 삭제)
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/settings/devices`, {
        data: { userName: initialUserName }
      });
      
      if (res.data.success) {
        setDevices([]);
        await fetchData(); 
        alert("기기가 삭제되었습니다.");
      } else {
        alert("삭제 요청은 보냈으나 실패했습니다.");
      }
    } catch (err) {
      console.error("기기 삭제 통신 실패:", err);
      alert('기기 삭제에 실패했습니다. (콘솔 확인)');
    }
  };
  
  const addDevice = () => {
    if (!newDevice.name.trim()) {
        alert("기기 이름을 입력해주세요.");
        return;
    }
    setDevices([...devices, { ...newDevice, id: Date.now(), time: '방금', status: '연결됨' }]);
    setShowDeviceModal(false);
    setNewDevice({ name: '', location: '' });
  };
  
  const handleProfileChange = (key, val) => {
    setProfile(prev => ({ ...prev, [key]: val }));
  };

  const saveProfile = async () => {
    try {
      // 5. 환경변수 적용 완료 (PUT - 프로필 저장)
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/settings/profile`, {
        userName: profile.userName,
        userEmail: profile.userEmail,
        userSpace: profile.userSpace
      });

      if (res.data && res.data.success) {
        alert('프로필이 저장되었습니다.');
        fetchData();
      } else {
        alert('저장에 실패했습니다: ' + (res.data.message || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('서버와 통신하는 중 오류가 발생했습니다. (콘솔을 확인하세요)');
    }
  };
  
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
            <span style={{ fontSize: '11px', color: isConnected ? '#10B981' : '#94A3B8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? '#10B981' : '#94A3B8', display: 'inline-block' }} />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", transition: 'all 0.5s ease' }}>
              {isConnected ? score : '--'}
            </span>
            <span style={{ fontSize: '14px', color: '#4A5568' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: theme.color, marginTop: '8px' }}>
            {isConnected ? statusText : '기기 연결 끊김'}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
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
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', 
                  background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent', 
                  borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent', 
                  transition: 'all 0.2s ease', textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>{label}</div>
                <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '4px' }}>{sub}</div>
              </div>
            );
          })}
        </nav>

        <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          마지막 업데이트 {formatTime(lastUpdate)}
        </div>
      </aside>

      <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: theme.bg, padding: '40px', boxSizing: 'border-box', transition: 'background 0.8s ease' }}>
        <ParticleBg color={theme.color} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A202C', margin: '0 0 20px 0' }}>설정</h1>
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #E2E8F0', marginBottom: '40px' }}>
              <button onClick={() => setActiveTab('alarm')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'alarm' ? '700' : '500', color: activeTab === 'alarm' ? theme.color : '#64748B', borderBottom: activeTab === 'alarm' ? `2px solid ${theme.color}` : 'none', transition: 'all 0.2s' }}>알림 설정</button>
              <button onClick={() => setActiveTab('device')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'device' ? '700' : '500', color: activeTab === 'device' ? theme.color : '#64748B', borderBottom: activeTab === 'device' ? `2px solid ${theme.color}` : 'none', transition: 'all 0.2s' }}>기기 관리</button>
              <button onClick={() => setActiveTab('profile')} style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'profile' ? '700' : '500', color: activeTab === 'profile' ? theme.color : '#64748B', borderBottom: activeTab === 'profile' ? `2px solid ${theme.color}` : 'none', transition: 'all 0.2s' }}>프로필 정보</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {activeTab === 'alarm' && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '60px' }}>
                <AlarmTab settings={settings} handleSettingChange={handleSettingChange} saveSettings={saveSettings} isLocked={isLocked}/>
              </div>
            )}
            {activeTab === 'device' && (
              <DeviceTab 
                devices={devices} 
                deleteDevice={deleteDevice} 
                showDeviceModal={showDeviceModal} 
                setShowDeviceModal={setShowDeviceModal} 
                newDevice={newDevice} 
                setNewDevice={setNewDevice} 
                addDevice={addDevice} 
                toggleDeviceStatus={toggleDeviceStatus} 
              />
            )}
            {activeTab === 'profile' && <ProfileTab profile={profile} handleProfileChange={handleProfileChange} saveProfile={saveProfile} isLocked={isLocked} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;