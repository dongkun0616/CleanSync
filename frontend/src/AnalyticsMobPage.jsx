import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// 센서 컬러 (홈/PC 글래스모피즘 테마와 동일하게 쨍한 톤으로 매칭)
const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#10B981', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', min: 850, max: 950 },
  { id: 'temp', label: '온도', color: '#EF4444', min: 20, max: 23 },
  { id: 'humi', label: '습도', color: '#3B82F6', min: 45, max: 55 },
  { id: 'noise', label: '소음', color: '#8B5CF6', min: 34, max: 44 },
  { id: 'pm10', label: '미세먼지', color: '#64748B', min: 10, max: 20 }
];

const AnalyticsMobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── 상태 관리 ──
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2', 'temp', 'humi', 'noise', 'pm10']);

  // (임시) 헤더 점수 표시를 위한 가상 데이터 (홈 화면과 동일)
  const [sensorData] = useState({ score: 45, statusText: '혼잡' });

  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: '#F0FDF4' };
    if (score >= 60) return { color: '#F59E0B', bg: '#FFFBEB' };
    return { color: '#EF4444', bg: '#FEF2F2' };
  };
  const theme = getTheme(sensorData.score);

  // ── 차트 데이터 로직 ──
  const generateAllData = () => {
    return METRIC_CONFIG.map(metric => ({
      id: metric.id, label: metric.label,
      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (metric.max - metric.min) + metric.min)),
      borderColor: metric.color, backgroundColor: 'transparent',
      tension: 0.4, borderWidth: 2.5, pointRadius: 0,
    }));
  };

  const [fullDatasets, setFullDatasets] = useState(generateAllData());
  const labels = Array.from({ length: 24 }, (_, i) => {
    const hour = 22 + Math.floor(i / 6);
    const min = (i % 6) * 10 || '00';
    return `${hour >= 24 ? `0${hour-24}` : hour}:${min === 0 ? '00' : min}`;
  });

  const toggleMetric = (metricId) => {
    setActiveMetrics(prev => prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]);
  };

  const handleFilterClick = (time) => {
    setTimeFilter(time);
    setFullDatasets(generateAllData());
  };

  const chartData = { labels, datasets: fullDatasets.filter(ds => activeMetrics.includes(ds.id)) };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 1000, ticks: { stepSize: 250, color: '#94A3B8', font: { size: 10, family: "'DM Mono', monospace" } }, border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)', borderDash: [3, 3] } },
      x: { ticks: { color: '#94A3B8', font: { size: 9, family: "'DM Mono', monospace" }, maxTicksLimit: 6 }, border: { display: false }, grid: { display: false } }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1A202C', bodyColor: '#4A5568', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 } },
    interaction: { mode: 'index', intersect: false }
  };

  const navMenus = [
    { label: '홈', sub: '현재 상태', icon: '🏠', path: '/' },
    { label: '대시보드', sub: '실시간 센서', icon: '📊', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', icon: '📈', path: '/analytics' },
    { label: '설정', sub: '환경 설정', icon: '⚙️', path: '/settings' }
  ];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px', fontFamily: "'Pretendard', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── 내비게이션 드로어 (HomeMobPage와 동일) ── */}
      {isMenuOpen && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setIsMenuOpen(false)} />}
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
            const isActive = location.pathname === menu.path || (menu.path === '/analytics' && true);
            return (
              <div key={menu.path} onClick={() => { navigate(menu.path); setIsMenuOpen(false); }} 
                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 20px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer', background: isActive ? 'linear-gradient(90deg, #00A8FF, #0077FF)' : 'transparent' }}>
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

      {/* ── 헤더 (HomeMobPage와 동일) ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/')}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#00A8FF', borderRadius: '6px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚡</div>
          <span style={{ fontWeight: '700', color: '#1A202C' }}>Clean-Sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => setIsMenuOpen(true)}>
          <span style={{ fontWeight: '700', color: theme.color, fontFamily: "'DM Mono', monospace" }}>● {sensorData.score}</span>
          <span style={{ fontSize: '24px', color: '#1A202C' }}>☰</span>
        </div>
      </header>

      {/* ── 본문 콘텐츠 ── */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 타이틀 */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#1E293B', letterSpacing: '-0.5px' }}>통계 및 기록</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0 0' }}>과거 기록을 통해 패턴을 분석합니다</p>
        </div>

        {/* 상단 시간 필터 (소프트 화이트 카드 스타일) */}
        <div style={{ display: 'flex', backgroundColor: '#FFF', borderRadius: '16px', padding: '6px', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {['1시간', '6시간', '12시간', '24시간'].map(time => {
            const isActive = timeFilter === time;
            return (
              <button key={time} onClick={() => handleFilterClick(time)} 
                style={{ flex: 1, padding: '10px 0', fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? '#00A8FF' : '#64748B', backgroundColor: isActive ? '#F0F9FF' : 'transparent', borderRadius: '12px', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}>
                {time}
              </button>
            );
          })}
        </div>

        {/* 센서 토글 배지 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {METRIC_CONFIG.map(metric => {
            const isActive = activeMetrics.includes(metric.id);
            return (
              <div key={metric.id} onClick={() => toggleMetric(metric.id)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '24px', backgroundColor: isActive ? metric.color : '#FFF', color: isActive ? '#FFF' : '#4A5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', border: isActive ? 'none' : '1px solid #E2E8F0' }}>
                {!isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metric.color }} />}
                {metric.label}
              </div>
            );
          })}
        </div>

        {/* 2x2 인사이트 미니 카드 (HomeMobPage의 둥글고 푹신한 느낌) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: '최고 집중', val: '22:09', sub: '지수 94점', color: '#10B981' },
            { label: '최고 CO₂', val: '03:49', sub: '905 ppm', color: '#F59E0B' },
            { label: '쾌적 비율', val: '100%', sub: '선택 기간', color: '#3B82F6' },
            { label: '평균 지수', val: '93점', sub: '평균 소음 41dB', color: '#8B5CF6' }
          ].map((item, idx) => (
            <div key={idx} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: item.color, marginBottom: '8px' }}>{item.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: item.color, margin: '0 0 4px 0', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.5px' }}>{item.val}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* 기간 요약 수직 리스트 (둥근 테두리 + DM Mono 숫자) */}
        <div style={{ backgroundColor: '#FFF', borderRadius: '24px', padding: '8px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {[
            { label: 'CO₂', color: '#F59E0B', avg: '878', unit: 'ppm', range: '850~905ppm' },
            { label: '온도', color: '#EF4444', avg: '21.4', unit: '°C', range: '20.6~22.1°C' },
            { label: '습도', color: '#3B82F6', avg: '49.8', unit: '%', range: '45~54%' },
            { label: '소음', color: '#8B5CF6', avg: '40.5', unit: 'dB', range: '34~44dB' },
            { label: '미세먼지', color: '#64748B', avg: '14.1', unit: 'µg/m³', range: '12.3~15.9µg/m³' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === 4 ? 'none' : '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} /> {item.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', fontFamily: "'Pretendard', sans-serif" }}>avg </span> 
                  {item.avg}
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', fontFamily: "'Pretendard', sans-serif" }}> {item.unit}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.range}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 시계열 차트 영역 */}
        <div style={{ backgroundColor: '#FFF', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B' }}>📊 시계열 차트</div>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsMobPage;