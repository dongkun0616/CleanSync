import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#4CB5F5', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F6AD55', min: 850, max: 950 },
  { id: 'temp', label: '온도', color: '#FC8181', min: 20, max: 23 },
  { id: 'humi', label: '습도', color: '#63B3ED', min: 45, max: 55 },
  { id: 'noise', label: '소음', color: '#B794F4', min: 34, max: 44 },
  { id: 'pm10', label: '미세먼지', color: '#A0AEC0', min: 10, max: 20 }
];

const AnalyticsMobPage = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2', 'temp', 'humi', 'noise', 'pm10']);

  const generateAllData = () => {
    return METRIC_CONFIG.map(metric => ({
      id: metric.id,
      label: metric.label,
      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (metric.max - metric.min) + metric.min)),
      borderColor: metric.color,
      backgroundColor: 'transparent',
      tension: 0.4, borderWidth: 2, pointRadius: 0,
    }));
  };

  const [fullDatasets, setFullDatasets] = useState(generateAllData());
  const labels = Array.from({ length: 24 }, (_, i) => {
    const hour = 22 + Math.floor(i / 6);
    const min = (i % 6) * 10 || '00';
    return `${hour >= 24 ? `0${hour-24}` : hour}:${min === 0 ? '00' : min}`;
  });

  const toggleMetric = (metricId) => {
    setActiveMetrics(prev => 
      prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]
    );
  };

  const handleFilterClick = (time) => {
    setTimeFilter(time);
    setFullDatasets(generateAllData());
  };

  const chartData = {
    labels,
    datasets: fullDatasets.filter(ds => activeMetrics.includes(ds.id))
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 1000, ticks: { stepSize: 250, color: '#A0AEC0', font: { size: 10 } }, border: { display: false }, grid: { color: '#F1F5F9', borderDash: [3, 3] } },
      x: { ticks: { color: '#A0AEC0', font: { size: 9 }, maxTicksLimit: 6 }, border: { display: false }, grid: { display: false } }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    interaction: { mode: 'index', intersect: false }
  };

  const styles = {
    // 배경: 가로 스크롤 방지(overflowX: hidden) 추가 및 핑크빛 도트 패턴
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#FCF3F3', backgroundImage: 'radial-gradient(#F5E1E1 2px, transparent 2px)', backgroundSize: '30px 30px', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', textAlign: 'left', fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box', zIndex: 99999 },
    
    // 상단 헤더 (사이드바 대신 들어가는 모바일 전용 헤더)
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' },
    brandSection: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    logoIcon: { width: '24px', height: '24px', backgroundColor: '#F56565', borderRadius: '50%', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' },
    logoText: { fontSize: '16px', fontWeight: '800', color: '#1A1B23', letterSpacing: '-0.5px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '14px' },
    topScore: { color: '#F56565', fontWeight: '800', fontSize: '14px' },
    hamburger: { fontSize: '20px', color: '#1A1B23', cursor: 'pointer' },

    content: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' },
    
    titleSection: { marginBottom: '4px' },
    title: { fontSize: '24px', fontWeight: '800', margin: 0, color: '#1A202C' },
    subtitle: { fontSize: '13px', color: '#718096', margin: '6px 0 0 0', fontWeight: '500' },

    filterGroup: { display: 'flex', backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '4px', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
    filterBtn: (isActive) => ({ flex: 1, padding: '10px 0', fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#F56565' : '#718096', backgroundColor: isActive ? '#FFF5F5' : 'transparent', borderRadius: '10px', cursor: 'pointer', border: 'none', transition: 'all 0.2s', textAlign: 'center' }),

    legendBar: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    legendBadge: (color, isActive) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', backgroundColor: isActive ? color : '#FFFFFF', color: isActive ? '#FFFFFF' : '#4A5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', border: isActive ? 'none' : '1px solid #E2E8F0' }),
    dot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),

    insightGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    insightCard: () => ({ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' }),
    cardTitle: (color) => ({ fontSize: '13px', fontWeight: '700', color: color, marginBottom: '6px' }),
    cardValue: (color) => ({ fontSize: '24px', fontWeight: '800', color: color, margin: '0 0 4px 0', letterSpacing: '-0.5px' }),
    cardSub: () => ({ fontSize: '11px', color: '#718096', fontWeight: '500' }),

    summaryListContainer: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '8px 20px', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' },
    summaryListItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
    summaryListLeft: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#4A5568' },
    summaryListRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
    summaryAvg: () => ({ fontSize: '14px', fontWeight: '800', color: '#1A202C' }),
    summaryRange: { fontSize: '11px', color: '#A0AEC0', fontWeight: '500' },

    chartSection: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    chartTitle: { fontSize: '15px', fontWeight: '800', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '6px' },
    chartWrapper: { height: '220px', width: '100%' }
  };

  return (
    <div style={styles.wrapper}>
      {/* 1. 사이드바가 아닌 모바일 전용 상단 헤더 렌더링 */}
      <header style={styles.header}>
        <div style={styles.brandSection} onClick={() => navigate('/dashboard')}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>Clean-Sync</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.topScore}>● 45 혼잡</span>
          <span style={styles.hamburger}>☰</span>
        </div>
      </header>

      {/* 2. 본문 내용 */}
      <div style={styles.content}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>통계 및 기록</h1>
          <p style={styles.subtitle}>과거 기록을 통해 패턴을 분석합니다</p>
        </div>

        <div style={styles.filterGroup}>
          {['1시간', '6시간', '12시간', '24시간'].map(time => (
            <button key={time} style={styles.filterBtn(timeFilter === time)} onClick={() => handleFilterClick(time)}>{time}</button>
          ))}
        </div>

        <div style={styles.legendBar}>
          {METRIC_CONFIG.map(metric => {
            const isActive = activeMetrics.includes(metric.id);
            return (
              <div key={metric.id} style={styles.legendBadge(metric.color, isActive)} onClick={() => toggleMetric(metric.id)}>
                {!isActive && <div style={styles.dot(metric.color)}></div>}
                {metric.label}
              </div>
            );
          })}
        </div>

        <div style={styles.insightGrid}>
          <div style={styles.insightCard()}>
            <div style={styles.cardTitle('#16A34A')}>최고 집중</div>
            <div style={styles.cardValue('#16A34A')}>22:09</div>
            <div style={styles.cardSub()}>지수 94점</div>
          </div>
          <div style={styles.insightCard()}>
            <div style={styles.cardTitle('#D97706')}>최고 CO₂</div>
            <div style={styles.cardValue('#D97706')}>03:49</div>
            <div style={styles.cardSub()}>905 ppm</div>
          </div>
          <div style={styles.insightCard()}>
            <div style={styles.cardTitle('#0284C7')}>쾌적 비율</div>
            <div style={styles.cardValue('#0284C7')}>100%</div>
            <div style={styles.cardSub()}>선택 기간</div>
          </div>
          <div style={styles.insightCard()}>
            <div style={styles.cardTitle('#7C3AED')}>평균 지수</div>
            <div style={styles.cardValue('#7C3AED')}>93점</div>
            <div style={styles.cardSub()}>평균 소음 41 dB</div>
          </div>
        </div>

        <div style={styles.summaryListContainer}>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#F6AD55')}></div> CO₂</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg()}>avg 878ppm</span>
              <span style={styles.summaryRange}>850~905ppm</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#FC8181')}></div> 온도</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg()}>avg 21.4°C</span>
              <span style={styles.summaryRange}>20.6~22.1°C</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#63B3ED')}></div> 습도</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg()}>avg 49.8%</span>
              <span style={styles.summaryRange}>45~54%</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#B794F4')}></div> 소음</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg()}>avg 40.5dB</span>
              <span style={styles.summaryRange}>34~44dB</span>
            </div>
          </div>
          <div style={{...styles.summaryListItem, borderBottom: 'none'}}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#A0AEC0')}></div> 미세먼지</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg()}>avg 14.1µg/m³</span>
              <span style={styles.summaryRange}>12.3~15.9µg/m³</span>
            </div>
          </div>
        </div>

        <div style={styles.chartSection}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitle}>📊 시계열 차트 보기</div>
            <div style={{color: '#A0AEC0', fontSize: '14px', fontWeight: 'bold'}}>▲</div>
          </div>
          <div style={styles.chartWrapper}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsMobPage;