import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#10B981', axis: 'y' },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', axis: 'y1' },
  { id: 'temp', label: '온도', color: '#EF4444', axis: 'y2' },
  { id: 'humi', label: '습도', color: '#3B82F6', axis: 'y' },
  { id: 'noise', label: '소음', color: '#8B5CF6', axis: 'y2' },
  { id: 'pm10', label: '미세먼지', color: '#64748B', axis: 'y2' }
];

const AnalyticsMobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score']);
  const [apiData, setApiData] = useState(null);
  const [sensorData] = useState({ score: 45, statusText: '혼잡' });

  const fetchAnalyticsData = async (range) => {
    try {
      const rangeCode = range.replace('시간', 'h');
      const response = await axios.get(`http://localhost:3000/analytics?range=${rangeCode}`);
      if (response.data && response.data.success) {
        setApiData(response.data.data);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(timeFilter);
  }, [timeFilter]);

  const statistics = useMemo(() => {
    if (!apiData || !apiData.chart) return null;
    const data = apiData.chart;
    const getStats = (key, unit) => {
      const values = data.map(item => item[key] || 0).filter(v => v > 0);
      if (values.length === 0) return { avg: 0, min: 0, max: 0, unit };
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { avg, min: Math.min(...values), max: Math.max(...values), unit };
    };
    return {
      score: getStats('spaceScore', '점'),
      co2: getStats('co2', 'ppm'),
      temp: getStats('temperature', '°C'),
      humi: getStats('humidity', '%'),
      noise: getStats('noise', 'dB'),
      pm10: getStats('dustPm10', 'μg/m³')
    };
  }, [apiData]);

  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: '#F0FDF4' };
    if (score >= 60) return { color: '#F59E0B', bg: '#FFFBEB' };
    return { color: '#EF4444', bg: '#FEF2F2' };
  };
  const theme = getTheme(sensorData.score);

  const toggleMetric = (metricId) => {
    setActiveMetrics(prev => prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]);
  };

  const handleFilterClick = (time) => {
    setTimeFilter(time);
    fetchAnalyticsData(time);
  };

  const chartData = apiData ? {
    labels: apiData.chart.map(item => item.time.substring(11, 16)),
    datasets: METRIC_CONFIG
      .filter(metric => activeMetrics.includes(metric.id))
      .map(metric => {
        const apiField = metric.id === 'score' ? 'spaceScore' : metric.id === 'temp' ? 'temperature' : metric.id === 'humi' ? 'humidity' : metric.id === 'pm10' ? 'dustPm10' : metric.id;
        return {
          label: metric.label,
          data: apiData.chart.map(item => item[apiField] || 0),
          borderColor: metric.color,
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 0,
          yAxisID: metric.axis,
        };
      })
  } : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { position: 'left', display: activeMetrics.some(m => ['score', 'humi'].includes(m)), grid: { color: 'rgba(0,0,0,0.04)' } },
      y1: { position: 'right', display: activeMetrics.includes('co2'), grid: { display: false } },
      y2: { position: 'right', display: activeMetrics.some(m => ['temp', 'noise', 'pm10'].includes(m)), grid: { display: false } },
      x: { ticks: { color: '#94A3B8', font: { size: 9 }, maxTicksLimit: 6 }, grid: { display: false } }
    },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px', fontFamily: "'Pretendard', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {isMenuOpen && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setIsMenuOpen(false)} />}
      
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

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#1E293B', letterSpacing: '-0.5px' }}>통계 및 기록</h1>
        </div>

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

        {/* 사진과 같은 4개의 카드 UI */}
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

        {/* 상세 요약 리스트 (avg 및 min~max 범위 표시) */}
        <div style={{ backgroundColor: '#FFF', borderRadius: '24px', padding: '8px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {statistics && METRIC_CONFIG.map((metric, idx) => {
            const stat = statistics[metric.id];
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === 5 ? 'none' : '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metric.color }} /> {metric.label}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', fontFamily: "'DM Mono', monospace" }}>
                    avg {stat.avg.toFixed(1)} {stat.unit}
                  </span>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>
                    {stat.min.toFixed(0)}~{stat.max.toFixed(0)}{stat.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', marginBottom: '20px' }}>시계열 차트</div>
          <div style={{ height: '220px', width: '100%' }}>
            {apiData && <Line data={chartData} options={chartOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMobPage;