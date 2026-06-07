import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#10B981', axis: 'y' },
  { id: 'humi', label: '습도', color: '#3B82F6', axis: 'y' },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', axis: 'y1' },
  { id: 'temp', label: '온도', color: '#EF4444', axis: 'y2' },
  { id: 'noise', label: '소음', color: '#8B5CF6', axis: 'y2' },
  { id: 'pm10', label: '미세먼지', color: '#64748B', axis: 'y2' }
];

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score']);
  const [sensorData, setSensorData] = useState({ score: 0, statusText: '데이터 로딩 중...' });
  const [lastUpdate] = useState(new Date());
  const [apiData, setApiData] = useState(null);
  const [isDataEmpty, setIsDataEmpty] = useState(false);

  // 공간 점수 기반 상태 등급 계산 함수
  const getStatusLevel = (score) => {
    if (score >= 90) return "매우 쾌적";
    if (score >= 75) return "쾌적";
    if (score >= 60) return "보통";
    if (score >= 40) return "나쁨";
    return "매우 나쁨";
  };

  // 브라우저 확대/축소 방지 로직
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rangeMap = { '1시간': '1h', '6시간': '6h', '12시간': '12h', '24시간': '24h' };
        const range = rangeMap[timeFilter] || '6h';
        const url = `http://localhost:3000/analytics?range=${range}`;
        
        console.log("DEBUG: [Request] Fetching analytics data from:", url);
        
        const res = await axios.get(url);
        
        console.log("DEBUG: [Response] Received API data:", res.data);
        
        if (res.data && res.data.success && res.data.data) {
          const rawData = res.data.data;
          const chartData = rawData.chart || [];
          
          // [수정된 부분] API 응답에서 점수를 가져와 getStatusLevel로 상태 텍스트 업데이트
          if (chartData.length > 0) {
            const latest = chartData[chartData.length - 1];
            const score = latest.spaceScore ?? 0;
            setSensorData({
              score: score,
              statusText: getStatusLevel(score)
            });
          }

          console.log("DEBUG: [Process] Chart data length:", chartData.length);
          
          setIsDataEmpty(chartData.length === 0);
          
          const labels = chartData.map(item => {
            const d = new Date(item.time);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          });

          const metrics = {
            score: chartData.map(item => item.spaceScore || 0),
            co2: chartData.map(item => item.co2 || 0),
            temp: chartData.map(item => item.temperature || 0),
            humi: chartData.map(item => item.humidity || 0),
            noise: chartData.map(item => item.noise || 0),
            pm10: chartData.map(item => item.dustPm10 || 0)
          };

          setApiData({ 
            labels: labels, 
            metrics: metrics, 
            summary: rawData.summary || {},
            insights: rawData.insights || []
          });
        } else {
          console.log("DEBUG: [Response] Data missing or success: false");
          setIsDataEmpty(true);
        }
      } catch (err) {
        console.error("DEBUG: [Error] API 통신 중 에러 발생:", err);
        setIsDataEmpty(true);
        setApiData(null);
      }
    };
    fetchData();
  }, [timeFilter]);

  const { bestFocusInsight, co2WarningInsight, goodRatioInsight, avgScoreInsight } = useMemo(() => {
    const insightsList = apiData?.insights || [];
    return {
      bestFocusInsight: insightsList.find(i => i.type === 'best_focus_time'),
      co2WarningInsight: insightsList.find(i => i.type === 'co2_warning'),
      goodRatioInsight: insightsList.find(i => i.type === 'good_ratio'),
      avgScoreInsight: insightsList.find(i => i.type === 'average_score')
    };
  }, [apiData]);

  const generateLabels = (filter) => {
    const generatedLabels = [];
    const now = new Date();
    let hours = 6;
    let points = 24; 

    if (filter === '1시간') hours = 1;
    else if (filter === '6시간') hours = 6;
    else if (filter === '12시간') hours = 12;
    else if (filter === '24시간') hours = 24;

    const intervalMs = (hours * 60 * 60 * 1000) / points;

    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      generatedLabels.push(`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`);
    }
    return generatedLabels;
  };

  const labels = apiData?.labels?.length > 0 ? apiData.labels : generateLabels(timeFilter);
  
  const datasets = METRIC_CONFIG.filter(metric => activeMetrics.includes(metric.id)).map(metric => ({
    id: metric.id,
    label: metric.label,
    data: apiData?.metrics?.[metric.id] || [], 
    borderColor: metric.color,
    backgroundColor: 'transparent',
    yAxisID: metric.axis, 
    tension: 0.3, 
    borderWidth: 2.5, 
    pointRadius: 0, 
    pointHoverRadius: 6,
  }));

  const chartData = { labels, datasets };

  const chartOptions = {
    responsive: true, 
    maintainAspectRatio: false,
    layout: { padding: { top: 20, right: 20, bottom: 0, left: 10 } },
    scales: {
      y: { 
        type: 'linear', 
        position: 'left', 
        suggestedMin: 0, 
        suggestedMax: 100,
        display: activeMetrics.some(m => ['score', 'humi'].includes(m)),
        ticks: { color: '#94A3B8', font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.04)' }
      },
      y1: {
        type: 'linear', 
        position: 'right', 
        suggestedMin: 400, 
        suggestedMax: 1500,
        display: activeMetrics.includes('co2'),
        ticks: { color: '#F59E0B', font: { size: 10 } },
        grid: { drawOnChartArea: false }
      },
      y2: {
        type: 'linear', 
        position: 'right', 
        suggestedMin: 0, 
        suggestedMax: 60,
        display: activeMetrics.some(m => ['temp', 'noise', 'pm10'].includes(m)),
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { drawOnChartArea: false }
      },
      x: { 
        ticks: { color: '#94A3B8', font: { size: 10 }, maxRotation: 45 },
        grid: { display: false }
      }
    },
    plugins: { 
      legend: { display: false }, 
      tooltip: { mode: 'index', intersect: false } 
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const toggleMetric = (metricId) => {
    setActiveMetrics(prev => prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]);
  };

  const handleFilterClick = (time) => setTimeFilter(time);

  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 60) return { color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(sensorData.score);
  
  const formatTime = (d) => d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}` : '--:--:--';

  const glassCardStyle = {
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  };

  const summaryKeyMap = {
    co2: 'co2', temp: 'temperature', humi: 'humidity', noise: 'noise', pm10: 'dustPm10'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { font-family: 'Pretendard', sans-serif; box-sizing: border-box; }
      `}</style>

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
            <span style={{ fontSize: '14px', color: '#4A5568'}}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>{sensorData.statusText}</div>
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
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent', 
                  borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent', 
                  transition: 'all 0.2s ease',
                  textAlign: 'center' 
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

      <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: theme.bg, transition: 'background 0.8s ease', display: 'flex', flexDirection: 'column', padding: '40px 48px' }}>
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

        <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, zIndex: 10 }}>
          <section style={{ ...glassCardStyle, flex: '7', padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C' }}>시계열 데이터</div>
            </div>
            <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDataEmpty ? (
                <div style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '600' }}>해당 기간에 데이터가 없습니다.</div>
              ) : (
                <Line 
                  key={timeFilter + (apiData ? '-data-loaded' : '-loading')}
                  data={chartData} 
                  options={chartOptions} 
                />
              )}
            </div>
          </section>

          <section style={{ flex: '3', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C', paddingLeft: '4px' }}>⭐ 인사이트</div>
            <div style={{ ...glassCardStyle, padding: '24px', overflowY: 'auto' }}>
              
              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#10B981', marginBottom: '6px' }}>
                  ✨ {bestFocusInsight?.title || '최고 집중 시간대'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: bestFocusInsight?.time ? '#10B981' : '#94A3B8', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  {bestFocusInsight?.time ? new Date(bestFocusInsight.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '데이터 없음'}
                </div>
                {bestFocusInsight?.message && (
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{bestFocusInsight.message}</div>
                )}
              </div>
              
              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#F59E0B', marginBottom: '6px' }}>
                  ⚠️ {co2WarningInsight?.title || '최고 CO₂ 시점'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: co2WarningInsight?.time ? '#F59E0B' : '#94A3B8', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  {co2WarningInsight?.time ? new Date(co2WarningInsight.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '데이터 없음'}
                </div>
                {co2WarningInsight?.message && (
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{co2WarningInsight.message}</div>
                )}
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#6366F1', marginBottom: '6px' }}>
                  ✅ {goodRatioInsight?.title || '쾌적 환경 비율'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: goodRatioInsight ? '#6366F1' : '#94A3B8', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  {goodRatioInsight ? (goodRatioInsight.value || '0%') : '데이터 없음'}
                </div>
                {goodRatioInsight?.message && (
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{goodRatioInsight.message}</div>
                )}
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#4A5568', marginBottom: '6px' }}>
                  🎯 {avgScoreInsight?.title || '평균 학습 지수'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: avgScoreInsight ? '#4A5568' : '#94A3B8', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  {avgScoreInsight ? (avgScoreInsight.value || '0점') : '데이터 없음'}
                </div>
                {avgScoreInsight?.message && (
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{avgScoreInsight.message}</div>
                )}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#4A5568', marginBottom: '16px' }}>기간 요약</div>
                {isDataEmpty ? (
                   <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>데이터가 없습니다</div>
                ) : (
                  [
                    { label: 'CO₂', id: 'co2', color: '#F59E0B', unit: 'ppm' },
                    { label: '온도', id: 'temp', color: '#EF4444', unit: '°C' },
                    { label: '습도', id: 'humi', color: '#3B82F6', unit: '%' },
                    { label: '소음', id: 'noise', color: '#8B5CF6', unit: 'dB' },
                    { label: '미세먼지', id: 'pm10', color: '#64748B', unit: 'µg' }
                  ].map((item, idx) => {
                    const backendKey = summaryKeyMap[item.id];
                    const backendAvg = apiData?.summary?.[backendKey]?.avg ?? '0.0';

                    return (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 0', borderBottom: idx === 4 ? 'none' : '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', fontWeight: '600' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.color }} />
                          {item.label}
                        </div>
                        <div style={{ fontWeight: '700', color: '#1A202C', fontFamily: "'DM Mono', monospace" }}>
                          avg {backendAvg} <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'Pretendard', sans-serif" }}>{item.unit}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;