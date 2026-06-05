import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// 센서 색상 세팅
const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#10B981', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', min: 850, max: 1100 },
  { id: 'temp', label: '온도', color: '#EF4444', min: 20, max: 30 },
  { id: 'humi', label: '습도', color: '#3B82F6', min: 40, max: 60 },
  { id: 'noise', label: '소음', color: '#8B5CF6', min: 30, max: 55 },
  { id: 'pm10', label: '미세먼지', color: '#64748B', min: 10, max: 30 }
];

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── 상태 관리 ──
  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2']);
  
  // (임시) 사이드바 및 배경 테마를 위한 가상 상태값 (홈 화면의 혼잡 45점 기준 적용)
  const [sensorData] = useState({ score: 45, statusText: '혼잡' });
  const [lastUpdate] = useState(new Date());

  const generateAllData = () => {
    return METRIC_CONFIG.map(metric => ({
      id: metric.id,
      label: metric.label,
      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (metric.max - metric.min) + metric.min)),
      borderColor: metric.color,
      backgroundColor: 'transparent',
      tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6,
    }));
  };

  const [fullDatasets, setFullDatasets] = useState(generateAllData());
  const labels = Array.from({ length: 24 }, (_, i) => `${10 + Math.floor(i / 4)}:${(i % 4) * 15 || '00'}`);

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
      y: { min: 0, max: 1200, ticks: { stepSize: 300, color: '#94A3B8', font: { size: 11, family: "'DM Mono', monospace" } }, border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)', borderDash: [5, 5] } },
      x: { ticks: { color: '#94A3B8', font: { size: 10, family: "'DM Mono', monospace" } }, border: { display: false }, grid: { display: false } }
    },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1A202C', bodyColor: '#4A5568', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  // ── 테마 및 시간 포맷 함수 (HomePage와 동일) ──
  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 60) return { color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(sensorData.score);
  
  const formatTime = (d) => d
    ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
    : '--:--:--';

  // ── 홈 화면 느낌의 글래스모피즘(유리 질감) 카드 공통 스타일 ──
  const glassCardStyle = {
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)', // 사파리 지원
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { font-family: 'Pretendard', sans-serif; box-sizing: border-box; }
      `}</style>

      {/* ── 1. 사이드바 (HomePage와 완전 동일) ── */}
      <aside style={{ width: '230px', minWidth: '230px', height: '100%', background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)', color: '#FFF', padding: '28px 20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
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
            <span style={{ fontSize: '48px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", transition: 'all 0.5s ease' }}>{sensorData.score}</span>
            <span style={{ fontSize: '14px', color: '#4A5568', fontFamily: "'DM Mono', monospace" }}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>{sensorData.statusText}</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '🏠', label: '홈', sub: '현재 상태', path: '/' },
            { icon: '📊', label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
            { icon: '📈', label: '통계', sub: '기록 분석', path: '/analytics' },
            { icon: '⚙️', label: '설정', sub: '환경 설정', path: '/settings' },
          ].map(({ icon, label, sub, path }) => {
            const isActive = location.pathname === path || (path === '/analytics' && true); // 통계 페이지 강제 활성화 처리 (혹시 모를 에러 방지)
            return (
              <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent', borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent', transition: 'all 0.2s ease' }}>
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

      {/* ── 2. 메인 패널 (HomePage 배경 테마 적용) ── */}
      <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: theme.bg, transition: 'background 0.8s ease', display: 'flex', flexDirection: 'column', padding: '40px 48px' }}>
        
        {/* 상단 헤더 & 필터 영역 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#1A202C', letterSpacing: '-0.5px' }}>통계 및 기록</h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '8px 0 0 0' }}>과거 기록을 통해 패턴을 분석합니다</p>
          </div>
          <div style={{ ...glassCardStyle, padding: '4px', display: 'flex', borderRadius: '12px' }}>
            {['1시간', '6시간', '12시간', '24시간'].map(time => {
              const isActive = timeFilter === time;
              return (
                <button key={time} onClick={() => handleFilterClick(time)} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? theme.color : '#64748B', backgroundColor: isActive ? 'rgba(255,255,255,0.9)' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: 'none', boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                  {time}
                </button>
              );
            })}
          </div>
        </header>

        {/* 범례 배지 (Glassmorphism 적용) */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', zIndex: 10 }}>
          {METRIC_CONFIG.map(metric => {
            const isActive = activeMetrics.includes(metric.id);
            return (
              <div key={metric.id} onClick={() => toggleMetric(metric.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', backgroundColor: isActive ? metric.color : 'rgba(255,255,255,0.7)', color: isActive ? '#FFF' : '#4A5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', border: isActive ? '1px solid transparent' : '1px solid rgba(255,255,255,0.9)', boxShadow: isActive ? `0 4px 12px ${metric.color}40` : '0 2px 8px rgba(0,0,0,0.03)', backdropFilter: 'blur(8px)' }}>
                {!isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metric.color }} />}
                {metric.label}
              </div>
            );
          })}
        </div>

        {/* 70:30 콘텐츠 레이아웃 */}
        <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, zIndex: 10 }}>
          
          {/* 왼쪽: 70% 차트 영역 */}
          <section style={{ ...glassCardStyle, flex: '7', padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C' }}>📊 시계열 데이터</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>72개 데이터 포인트</div>
            </div>
            <div style={{ flex: 1, width: '100%', minHeight: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          {/* 오른쪽: 30% 인사이트 영역 */}
          <section style={{ flex: '3', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C', paddingLeft: '4px' }}>⭐ 인사이트</div>
            
            <div style={{ ...glassCardStyle, padding: '24px' }}>
              {/* 인사이트 미니 카드들 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#10B981', marginBottom: '6px' }}>✨ 최고 집중 시간대</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#10B981', fontFamily: "'DM Mono', monospace", marginBottom: '4px', letterSpacing: '-0.5px' }}>10:45</div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>학습 지수 94점으로 집중력이 가장 높은 시간입니다.</div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#F59E0B', marginBottom: '6px' }}>⚠️ 최고 CO₂ 시점</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#F59E0B', fontFamily: "'DM Mono', monospace", marginBottom: '4px', letterSpacing: '-0.5px' }}>16:40</div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>CO₂ 1013 ppm으로 환기가 필요한 시점입니다.</div>
              </div>

              {/* 기간 요약 리스트 */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#4A5568', marginBottom: '16px' }}>기간 요약</div>
                {[
                  { label: 'CO₂', color: '#F59E0B', val: '959.4', unit: 'ppm' },
                  { label: '온도', color: '#EF4444', val: '23.1', unit: '°C' },
                  { label: '습도', color: '#3B82F6', val: '40.9', unit: '%' },
                  { label: '소음', color: '#8B5CF6', val: '25.9', unit: 'dB' },
                  { label: '미세먼지', color: '#64748B', val: '5.6', unit: 'µg' }
                ].map((item, idx) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 0', borderBottom: idx === 4 ? 'none' : '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', fontWeight: '600' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.color }} />
                      {item.label}
                    </div>
                    <div style={{ fontWeight: '700', color: '#1A202C', fontFamily: "'DM Mono', monospace" }}>
                      avg {item.val} <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'Pretendard', sans-serif" }}>{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;