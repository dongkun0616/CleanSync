import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ParticleBg = ({ color }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const NUM = 50;
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const hexColor = color.replace('#', '');
        ctx.fillStyle = '#' + hexColor + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}
    />
  );
};

const GlassMiniCard = ({ icon, label, value, unit, color }) => (
  <div style={{
    backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: '16px',
    padding: '16px 20px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center', gap: '14px',
  }}>
    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {/* 여기서 크기를 32px로 통일했습니다 */}
      <img src={icon} alt={label} style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block' }} />
    </div>
    <div>
      <div style={{ fontSize: '11px', color: '#8FA3B1', fontWeight: '600', marginBottom: '3px', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A202C', fontFamily: "'DM Mono', monospace" }}>{value}</span>
        <span style={{ fontSize: '12px', color: '#8FA3B1', fontWeight: '600' }}>{unit}</span>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate(); 
  const location = useLocation(); 

  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    score: 0, displayScore: 0, statusLevel: '로딩 중...', co2: 0, noise: 0, temperature: 0, humidity: 0, dustPm10: 0, dustPm25: 0
  });

  const [chartDataList, setChartDataList] = useState({
    co2: [], noise: [], temp: [], humi: [], pm10: [], pm25: [], times: []
  });

  const [rawLogs, setRawLogs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('co2');
  const [dustMode, setDustMode] = useState('pm10');

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const initialUserName = 'dongdong'; 
        
        // 1. Vite 환경변수(import.meta.env.VITE_API_URL) 적용하여 프로필 요청
        const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile?userName=${initialUserName}`, { signal: controller.signal });
        const settingsResult = await settingsRes.json();
        
        let userSpace = '동아리방'; 
        if (settingsResult.success && settingsResult.data && settingsResult.data.userSpace) {
          userSpace = settingsResult.data.userSpace;
        }

        // 2. Vite 환경변수 적용하여 디바이스 상태 요청
        const deviceRes = await fetch(`${import.meta.env.VITE_API_URL}/settings/devices?userName=${initialUserName}`, { signal: controller.signal });
        const deviceResult = await deviceRes.json();
        
        // 기기가 '연결됨' 상태인지 확인
        if (deviceResult?.data?.deviceStatus !== '연결됨') {
          setIsConnected(false);
          return;
        }

        // 3. Vite 환경변수 적용하여 대시보드 데이터 요청
        const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard?location=${encodeURIComponent(userSpace)}`, { signal: controller.signal });
        const result = await response.json();
        
        if (result && result.success && result.data) {
          setIsConnected(true);
          const { current, charts } = result.data;
          if (current) {
            const rawScore = Number(current.score || 0);
            const scaledScore = rawScore > 100 ? Math.round(rawScore / 10) : rawScore;
            
            setSensorData({
              score: scaledScore,
              displayScore: rawScore,
              statusLevel: current.statusLevel || '알 수 없음', 
              co2: Number(current.co2 || 0),
              noise: Number(current.noise || 0),
              temperature: Number(current.temperature || 0),
              humidity: Number(current.humidity || 0),
              dustPm10: Number(current.dustPm10 || 0),
              dustPm25: Number(current.dustPm25 || 0)
            });
            setLastUpdate(new Date());
          }
          if (Array.isArray(charts)) {
            setRawLogs(charts);
            setChartDataList({
              co2: charts.map(d => Number(d.co2 || 0)),
              noise: charts.map(d => Number(d.noise || 0)),
              temp: charts.map(d => Number(d.temperature || 0)),
              humi: charts.map(d => Number(d.humidity || 0)),
              pm10: charts.map(d => Number(d.dustPm10 || 0)),
              pm25: charts.map(d => Number(d.dustPm25 || 0)),
              times: charts.map(d => d.time || ''),
            });
          }
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setIsConnected(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const getTheme = (score, isConn) => {
    if (!isConn) return { color: '#94A3B8', bg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)' };
    if (score >= 90) return { color: "#059669", bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 75) return { color: "#10B981", bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 60) return { color: "#F59E0B", bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    if (score >= 40) return { color: "#EF4444", bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: "#B91C1C", bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(sensorData.score, isConnected);

  const formatTime = (d) => d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}` : '--:--:--';
  const formatLogTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };
  const formatChartTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const generateChartConfig = () => {
    const labels = chartDataList.times.map(t => formatChartTime(t));
    if (activeTab === 'co2') return { labels, datasets: [{ label: '이산화탄소 (ppm)', data: chartDataList.co2, borderColor: theme.color, backgroundColor: theme.color + '12', fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2 }] };
    if (activeTab === 'noise') return { labels, datasets: [{ label: '소음 (dB)', data: chartDataList.noise, borderColor: '#4393F9', backgroundColor: 'rgba(67, 147, 249, 0.08)', fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2 }] };
    if (activeTab === 'temphumi') return { labels, datasets: [{ label: '온도 (°C)', data: chartDataList.temp, borderColor: '#EF4444', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2.5, yAxisID: 'y', pointRadius: 1 }, { label: '습도 (%)', data: chartDataList.humi, borderColor: '#3B82F6', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2.5, yAxisID: 'y1', pointRadius: 1 }] };
    if (activeTab === 'dust') {
      const isPm10 = dustMode === 'pm10';
      return { labels, datasets: [{ label: isPm10 ? '미세먼지 PM10 (㎍/㎥)' : '초미세먼지 PM2.5 (㎍/㎥)', data: isPm10 ? chartDataList.pm10 : chartDataList.pm25, borderColor: isPm10 ? '#8B5CF6' : '#EC4899', backgroundColor: isPm10 ? 'rgba(139, 92, 246, 0.08)' : 'rgba(236, 72, 153, 0.08)', fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2 }] };
    }
    return { labels: [], datasets: [] };
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: activeTab === 'temphumi', position: 'top', labels: { font: { family: 'Pretendard' } } }, tooltip: { enabled: true, mode: 'index', intersect: false, boxPadding: 6 } }, scales: { x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11, family: 'DM Mono' } } }, y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#64748B', font: { family: 'DM Mono' } } }, ...(activeTab === 'temphumi' ? { y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#3B82F6', font: { family: 'DM Mono' } } } } : {}) } };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box' }}>
      <style>{`@import url('https://webfontworld.github.io/pretendard/Pretendard.css'); @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap'); * { font-family: 'Pretendard', sans-serif; }`}</style>
      <aside style={{ width: '230px', minWidth: '230px', height: '100%', background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)', color: '#FFF', padding: '28px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: `0 4px 12px ${theme.color}44` }}>⚡</div>
          <div><div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Clean-Sync</div><div style={{ fontSize: '10px', color: '#6B7A99', marginTop: '1px' }}>학습 환경 모니터</div></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><span style={{ fontSize: '12px', color: '#6B7A99', fontWeight: '600' }}>학습 지수</span><span style={{ fontSize: '11px', color: isConnected ? '#10B981' : '#94A3B8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? '#10B981' : '#94A3B8', display: 'inline-block' }} />{isConnected ? 'LIVE' : 'OFFLINE'}</span></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}><span style={{ fontSize: '48px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", transition: 'all 0.5s ease' }}>{isConnected ? sensorData.score : '--'}</span><span style={{ fontSize: '14px', color: '#4A5568' }}>/ 100</span></div>
          <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>{isConnected ? sensorData.statusLevel : '기기 연결 끊김'}</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {[{ label: '홈', sub: '현재 상태', path: '/' }, { label: '대시보드', sub: '실시간 센서', path: '/dashboard' }, { label: '통계', sub: '기록 분석', path: '/analytics' }, { label: '설정', sub: '환경 설정', path: '/settings' }].map(({ label, sub, path }) => {
            const isActive = location.pathname === path;
            return (
              <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent', borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent', transition: 'all 0.2s ease', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>{label}</div>
                <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '4px' }}>{sub}</div>
              </div>
            );
          })}
        </nav>
        <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>마지막 업데이트 {formatTime(lastUpdate)}</div>
      </aside>

      <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: theme.bg, transition: 'background 0.8s ease', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px 40px', boxSizing: 'border-box' }}>
        <ParticleBg color={theme.color} />
        {!isConnected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <h2 style={{ fontSize: '32px', color: '#475569', marginBottom: '16px', fontWeight: '800' }}>현재 기기가 연결되어 있지 않습니다.</h2>
            <p style={{ color: '#64748B', fontSize: '16px' }}>설정 페이지에서 기기 연결 상태를 다시 확인해주세요.</p>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A202C', margin: 0, letterSpacing: '-0.5px' }}>실시간 분석 대시보드</h2><p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>실시간 유입되는 센서 정보와 트렌드 이력을 깨끗한 글래스 가이드 뷰로 확인하세요.</p></div>
              <div style={{ backgroundColor: isConnected ? 'rgba(255,255,255,0.6)' : 'rgba(239, 68, 68, 0.1)', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', color: isConnected ? theme.color : '#EF4444', border: isConnected ? '1px solid rgba(255,255,255,0.8)' : '1px solid #FECACA' }}>{isConnected ? '데이터 실시간 동기화 완료' : '⚠️ 연결 끊김 (서버 확인 필요)'}</div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              <GlassMiniCard icon="/temp-icon.png" label="온도" value={isConnected ? sensorData.temperature : '--'} unit={isConnected ? '°C' : ''} color={theme.color} />
              <GlassMiniCard icon="/hum-icon.png" label="습도" value={isConnected ? sensorData.humidity : '--'} unit={isConnected ? '%' : ''} color={theme.color} />
              <GlassMiniCard icon="/co2-icon.png" label="이산화탄소" value={isConnected ? sensorData.co2 : '--'} unit={isConnected ? 'ppm' : ''} color={theme.color} />
              <GlassMiniCard icon="/noise-icon.png" label="소음" value={isConnected ? sensorData.noise : '--'} unit={isConnected ? 'dB' : ''} color={theme.color} />
              <GlassMiniCard icon="/dust-icon.png" label="미세먼지(PM10)" value={isConnected ? sensorData.dustPm10 : '--'} unit={isConnected ? '㎍/㎥' : ''} color={theme.color} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.color, display: 'inline-block' }} /><span style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>센서 지표별 트렌드 추이</span></div>
                  <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '10px', gap: '2px' }}>
                    {[{ id: 'co2', label: 'CO₂' }, { id: 'noise', label: '소음' }, { id: 'temphumi', label: '온도·습도' }, { id: 'dust', label: '미세먼지' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent', color: activeTab === tab.id ? '#1E293B' : '#64748B', transition: 'all 0.2s' }}>{tab.label}</button>
                    ))}
                  </div>
               </div>
               {activeTab === 'dust' && (
                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '6px' }}>
                   <button onClick={() => setDustMode('pm10')} style={{ padding: '4px 12px', borderRadius: '20px', border: dustMode === 'pm10' ? `1px solid ${theme.color}` : '1px solid rgba(0,0,0,0.1)', backgroundColor: dustMode === 'pm10' ? '#FFFFFF' : 'transparent', color: dustMode === 'pm10' ? theme.color : '#64748B', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>● 미세먼지 (PM10)</button>
                   <button onClick={() => setDustMode('pm25')} style={{ padding: '4px 12px', borderRadius: '20px', border: dustMode === 'pm25' ? '1px solid #EC4899' : '1px solid rgba(0,0,0,0.1)', backgroundColor: dustMode === 'pm25' ? '#FFFFFF' : 'transparent', color: dustMode === 'pm25' ? '#EC4899' : '#64748B', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>● 초미세먼지 (PM2.5)</button>
                 </div>
               )}
                <div style={{ height: '240px', width: '100%' }}>
                  <Line key={activeTab} data={generateChartConfig()} options={chartOptions} />
                </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '22px 24px', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '14px' }}><span style={{ fontSize: '15px', fontWeight: '700', color: '#1A202C', display: 'block' }}>수집 환경 데이터 종합 이력</span></div>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>수집 일시</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>CO₂</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>소음</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>온도</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>습도</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#8B5CF6' }}>PM10</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700', color: '#EC4899' }}>PM2.5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawLogs.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>{isConnected ? '데이터 동기화 중...' : '서버 연결 대기 중...'}</td></tr>
                    ) : (
                      rawLogs.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '12px 14px', color: '#64748B', fontFamily: "'DM Mono', monospace" }}>{formatLogTime(row.time)}</td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>{row.co2}</td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>{row.noise}</td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>{row.temperature}</td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>{row.humidity}</td>
                          <td style={{ padding: '12px 14px', color: '#8B5CF6' }}>{row.dustPm10}</td>
                          <td style={{ padding: '12px 14px', color: '#EC4899' }}>{row.dustPm25}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;