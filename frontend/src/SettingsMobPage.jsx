import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AlarmTab, DeviceTab, ProfileTab } from './components/Tabs';

const SettingsMobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUserName = 'dongdong';
  const locationName = '동아리방';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('alarm');
  const [isLocked, setIsLocked] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState(0);
  const [statusText, setStatusText] = useState('데이터 로딩 중...');

  const [settings, setSettings] = useState({ emailAlert: true, pushAlert: false, dailyReport: true, weeklyReport: false, co2: 1000, noise: 55, temp: 27, dust: 35 });
  const [devices, setDevices] = useState([]);
  const [profile, setProfile] = useState({ userName: '', userEmail: '', userSpace: '' });
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', location: '' });

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const handleSettingChange = (key, val) => {
    if (isLocked) {
      alert("기기가 등록되어 있고, 프로필 정보가 저장되어야 알림을 설정할 수 있습니다.");
      return;
    }
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/settings?userName=${initialUserName}&location=${locationName}`);
      if (res.data && res.data.success) {
        const { currentStatus, alerts, devices: deviceData, profile: profileData } = res.data.data;
        
        setSettings({
          emailAlert: alerts.emailAlertEnabled, pushAlert: alerts.pushAlertEnabled,
          dailyReport: alerts.dailyReportEnabled, weeklyReport: alerts.weeklyReportEnabled,
          co2: alerts.co2Threshold, noise: alerts.noiseThreshold, temp: alerts.temperatureThreshold, dust: alerts.dustThreshold
        });
        setProfile({ userName: profileData.userName || initialUserName, userEmail: profileData.userEmail || '', userSpace: profileData.userSpace || '' });

        const hasDevice = deviceData && deviceData.deviceName;
        setIsConnected(!!hasDevice);
        setIsLocked(!(profileData.userName && profileData.userEmail && hasDevice));

        if (hasDevice) {
          const currentScore = Number(currentStatus.spaceScore || 0);
          setScore(currentScore);
          setStatusText(currentScore >= 80 ? "쾌적" : currentScore >= 60 ? "보통" : "혼잡");
          setDevices([{ id: 1, name: deviceData.deviceName, status: deviceData.deviceStatus, lastConnected: deviceData.lastConnected }]);
        } else {
          setDevices([]); setScore(0); setStatusText("기기 미연결");
        }
      }
    } catch (err) { console.error("데이터 로드 실패", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const saveSettings = async () => {
    if (isLocked) { alert("기기 등록 및 프로필 저장이 필요합니다."); return; }
    await axios.put('http://localhost:5000/settings/alerts', { ...settings, userName: profile.userName });
    alert('설정이 저장되었습니다.');
    fetchData();
  };

  const toggleDeviceStatus = async (currentStatus) => {
    const newStatus = currentStatus === '연결됨' ? '연결안됨' : '연결됨';
    await axios.put('http://localhost:5000/settings/devices', { userName: initialUserName, deviceName: devices[0]?.name, deviceStatus: newStatus });
    fetchData();
  };

  const deleteDevice = async () => {
    await axios.delete('http://localhost:5000/settings/devices', { data: { userName: initialUserName } });
    setDevices([]);
    await fetchData();
    alert("기기가 삭제되었습니다.");
  };

  const saveProfile = async () => {
    await axios.put('http://localhost:5000/settings/profile', profile);
    alert('프로필이 저장되었습니다.');
    fetchData();
  };

  const navMenus = [
    { label: '홈', sub: '현재 상태', path: '/' },
    { label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', path: '/analytics' },
    { label: '설정', sub: '환경 설정', path: '/settings' },
  ];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#FFFFFF', paddingBottom: '40px', fontFamily: "'Pretendard', sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      
      {isMenuOpen && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setIsMenuOpen(false)} />}
      
      {/* 햄버거 메뉴 패널 (HomeMobPage와 동일한 구조) */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: '#111827', zIndex: 1001, transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '16px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
            <span style={{ fontWeight: '700', color: '#FFF' }}>Clean-Sync</span>
          </div>
          <span onClick={() => setIsMenuOpen(false)} style={{ color: '#FFF', fontSize: '24px', cursor: 'pointer' }}>✕</span>
        </div>
        <nav>
          {navMenus.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div key={menu.path} onClick={() => { navigate(menu.path); setIsMenuOpen(false); }} 
                style={{ padding: '18px 20px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer', background: isActive ? 'linear-gradient(90deg, #00A8FF, #0077FF)' : 'transparent' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>{menu.label}</div>
                <div style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : '#6B7A99', marginTop: '2px' }}>{menu.sub}</div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 헤더 (HomeMobPage와 동일한 구조) */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/')}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
          <span style={{ fontWeight: '700', color: '#1A202C' }}>Clean-Sync</span>
        </div>
        
        <div style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', cursor: 'pointer'}} onClick={() => setIsMenuOpen(true)}>
          <span style={{ color: isConnected ? getScoreColor(score) : '#94A3B8' }}>{isConnected ? `● ${score}` : '○ Offline'}</span>
          <span style={{ fontSize: '24px', color: '#1A202C', marginLeft: '10px' }}>☰</span>
        </div>
      </header>

      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '20px', color: '#1A202C', fontWeight: '800', marginBottom: '20px' }}>설정</h1>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['alarm', 'device', 'profile'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: activeTab === tab ? '#00A8FF' : '#F1F5F9', color: activeTab === tab ? '#FFF' : '#64748B', fontWeight: '700' }}>
              {tab === 'alarm' ? '알림' : tab === 'device' ? '기기' : '프로필'}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px 0' }}>
          {activeTab === 'alarm' && (
            <AlarmTab settings={settings} handleSettingChange={handleSettingChange} saveSettings={saveSettings} isLocked={isLocked}/>
          )}
          {activeTab === 'device' && (
            <DeviceTab devices={devices} deleteDevice={deleteDevice} showDeviceModal={showDeviceModal} setShowDeviceModal={setShowDeviceModal} newDevice={newDevice} setNewDevice={setNewDevice} addDevice={() => {}} toggleDeviceStatus={toggleDeviceStatus} />
          )}
          {activeTab === 'profile' && (
            <ProfileTab profile={profile} handleProfileChange={(k, v) => setProfile(prev => ({...prev, [k]: v}))} saveProfile={saveProfile} isLocked={isLocked} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsMobPage;