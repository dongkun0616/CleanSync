import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── 파티클 배경 ─────────────────────────────────────────────────
const ParticleBg = ({ color }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NUM = 28;
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 5 + 2,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.25 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

// ── 글래스모피즘 미니 센서 카드 ───────────────────────────────────────────────────
const GlassMiniCard = ({ icon, label, value, unit, color }) => (
  <div style={{
    backgroundColor: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  }}>
    <div style={{
      width: '42px', height: '42px', borderRadius: '10px',
      backgroundColor: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '22px', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '11px', color: '#8FA3B1', fontWeight: '600', marginBottom: '3px', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A202C', fontFamily: "'DM Mono', monospace" }}>
          {value}
        </span>
        <span style={{ fontSize: '12px', color: '#8FA3B1', fontWeight: '600' }}>{unit}</span>
      </div>
    </div>
  </div>
);

// ── 메인 대시보드 컴포넌트 ────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate(); 
  const location = useLocation(); 

  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    score: 0, displayScore: 0, statusText: '로딩 중...', co2: 0, noise: 0, temperature: 0, humidity: 0, dustPm10: 0, dustPm25: 0
  });

  const [chartDataList, setChartDataList] = useState({
    co2: [], noise: [], temp: [], humi: [], pm10: [], pm25: [], times: []
  });

  const [rawLogs, setRawLogs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [activeTab, setActiveTab] = useState('co2');
  const [dustMode, setDustMode] = useState('pm10');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard');
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
            statusText: current.statusText || '여유',
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
      setIsConnected(false);
      console.error('대시보드 트렌드 모니터 장애:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 60) return { color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(sensorData.score);

  const formatTime = (d) => d
    ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
    : '--:--:--';

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
    
    if (activeTab === 'co2') {
      return {
        labels,
        datasets: [{
          label: '이산화탄소 (ppm)',
          data: chartDataList.co2,
          borderColor: theme.color,
          backgroundColor: theme.color + '12',
          fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2
        }]
      };
    }
    if (activeTab === 'noise') {
      return {
        labels,
        datasets: [{
          label: '소음 (dB)',
          data: chartDataList.noise,
          borderColor: '#4393F9',
          backgroundColor: 'rgba(67, 147, 249, 0.08)',
          fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2
        }]
      };
    }
    if (activeTab === 'temphumi') {
      return {
        labels,
        datasets: [
          { label: '온도 (°C)', data: chartDataList.temp, borderColor: '#EF4444', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2.5, yAxisID: 'y', pointRadius: 1 },
          { label: '습도 (%)', data: chartDataList.humi, borderColor: '#3B82F6', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2.5, yAxisID: 'y1', pointRadius: 1 }
        ]
      };
    }
    if (activeTab === 'dust') {
      const isPm10 = dustMode === 'pm10';
      return {
        labels,
        datasets: [{
          label: isPm10 ? '미세먼지 PM10 (㎍/㎥)' : '초미세먼지 PM2.5 (㎍/㎥)',
          data: isPm10 ? chartDataList.pm10 : chartDataList.pm25,
          borderColor: isPm10 ? '#8B5CF6' : '#EC4899',
          backgroundColor: isPm10 ? 'rgba(139, 92, 246, 0.08)' : 'rgba(236, 72, 153, 0.08)',
          fill: true, tension: 0.38, borderWidth: 3, pointRadius: 2
        }]
      };
    }
    return { labels: [], datasets: [] };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: activeTab === 'temphumi', position: 'top', labels: { font: { family: 'Pretendard' } } },
      tooltip: { enabled: true, mode: 'index', intersect: false, boxPadding: 6 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11, family: 'DM Mono' } } },
      y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#64748B', font: { family: 'DM Mono' } } },
      ...(activeTab === 'temphumi' ? {
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#3B82F6', font: { family: 'DM Mono' } } }
      } : {})
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      display: 'flex', fontFamily: "'Pretendard', sans-serif",
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'Pretendard', sans-serif; }
      `}</style>

      {/* ── 사이드바 ── */}
      <aside style={{
        width: '230px', minWidth: '230px', height: '100%',
        background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)',
        color: '#FFF', padding: '28px 20px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: `0 4px 12px ${theme.color}44`,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Clean-Sync</div>
            <div style={{ fontSize: '10px', color: '#6B7A99', marginTop: '1px' }}>학습 환경 모니터</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', padding: '18px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7A99', fontWeight: '600' }}>종합 지수</span>
            <span style={{ fontSize: '11px', color: isConnected ? '#10B981' : '#EF4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? '#10B981' : '#EF4444', display: 'inline-block' }} />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '38px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", transition: 'all 0.5s ease' }}>
              {sensorData.displayScore}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>
            {sensorData.statusText}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '🏠', label: '홈', sub: '현재 상태', path: '/' },
            { icon: '📊', label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
            { icon: '📈', label: '통계', sub: '기록 분석', path: '/analytics' }, 
            { icon: '⚙️', label: '설정', sub: '환경 설정', path: '/settings' },
          ].map(({ icon, label, sub, path }) => {
            const isActive = location.pathname === path;
            return (
              <div key={label} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent',
                borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '1px' }}>{sub}</div>
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          마지막 업데이트 {formatTime(lastUpdate)}
        </div>
      </aside>

      <main style={{
        flex: 1, position: 'relative', overflowY: 'auto',
        background: theme.bg, transition: 'background 0.8s ease',
        display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px 40px',
        boxSizing: 'border-box'
      }}>
        <ParticleBg color={theme.color} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A202C', margin: 0, letterSpacing: '-0.5px' }}>실시간 분석 대시보드</h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>실시간 유입되는 센서 정보와 트렌드 이력을 깨끗한 글래스 가이드 뷰로 확인하세요.</p>
          </div>
          <div style={{ 
            backgroundColor: isConnected ? 'rgba(255,255,255,0.6)' : 'rgba(239, 68, 68, 0.1)', 
            padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', 
            color: isConnected ? theme.color : '#EF4444', 
            border: isConnected ? '1px solid rgba(255,255,255,0.8)' : '1px solid #FECACA' 
          }}>
            {isConnected ? '📊 데이터 실시간 동기화 완료' : '⚠️ 연결 끊김 (서버 확인 필요)'}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <GlassMiniCard icon="🌡️" label="온도" value={sensorData.temperature} unit="°C" color={theme.color} />
          <GlassMiniCard icon="💧" label="습도" value={sensorData.humidity} unit="%" color={theme.color} />
          <GlassMiniCard icon="💨" label="이산화탄소" value={sensorData.co2} unit="ppm" color={theme.color} />
          <GlassMiniCard icon="🔊" label="소음" value={sensorData.noise} unit="dB" color={theme.color} />
          <GlassMiniCard icon="😷" label="미세먼지(PM10)" value={sensorData.dustPm10} unit="㎍/㎥" color={theme.color} />
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px', padding: '24px',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* ... (차트 및 로그 테이블 부분 기존 동일) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.color, display: 'inline-block' }} />
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>센서 지표별 트렌드 추이</span>
            </div>
            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '10px', gap: '2px' }}>
              {[
                { id: 'co2', label: 'CO₂' },
                { id: 'noise', label: '소음' },
                { id: 'temphumi', label: '온도·습도' },
                { id: 'dust', label: '미세먼지' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                    backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                    color: activeTab === tab.id ? '#1E293B' : '#64748B',
                    boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {activeTab === 'dust' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '6px' }}>
              <button
                onClick={() => setDustMode('pm10')}
                style={{
                  padding: '4px 12px', borderRadius: '20px', border: dustMode === 'pm10' ? `1px solid ${theme.color}` : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: dustMode === 'pm10' ? '#FFFFFF' : 'transparent',
                  color: dustMode === 'pm10' ? theme.color : '#64748B', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}
              >● 미세먼지 (PM10)</button>
              <button
                onClick={() => setDustMode('pm25')}
                style={{
                  padding: '4px 12px', borderRadius: '20px', border: dustMode === 'pm25' ? '1px solid #EC4899' : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: dustMode === 'pm25' ? '#FFFFFF' : 'transparent',
                  color: dustMode === 'pm25' ? '#EC4899' : '#64748B', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}
              >● 초미세먼지 (PM2.5)</button>
            </div>
          )}
          <div style={{ height: '240px', width: '100%' }}>
            <Line data={generateChartConfig()} options={chartOptions} />
          </div>
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px', padding: '22px 24px',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
        }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1A202C', display: 'block' }}>📋 수집 환경 데이터 종합 이력</span>
          </div>
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
      </main>
    </div>
  );
};

export default DashboardPage;