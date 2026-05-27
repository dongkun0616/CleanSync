import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// 센서 색상 및 데이터 설정 (피그마 모바일 시안 컬러코드 반영)
const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#4CB5F5', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F5A623', min: 850, max: 950 },
  { id: 'temp', label: '온도', color: '#E02020', min: 20, max: 23 },
  { id: 'humi', label: '습도', color: '#4A90E2', min: 45, max: 55 },
  { id: 'noise', label: '소음', color: '#8B572A', min: 34, max: 44 }, // 피그마 보라색 톤
  { id: 'pm10', label: '미세먼지', color: '#6A737D', min: 10, max: 20 }
];

const AnalyticsMobPage = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('6시간');
  
  // 모바일 피그마는 6개가 다 켜져있는 상태로 보이므로 전체 활성화
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2', 'temp', 'humi', 'noise', 'pm10']);

  const generateAllData = () => {
    return METRIC_CONFIG.map(metric => ({
      id: metric.id,
      label: metric.label,
      data: Array.from({ length: 24 }, () => 
        metric.id === 'co2' ? Math.floor(Math.random() * (950 - 850) + 850) : Math.floor(Math.random() * (metric.max - metric.min) + metric.min)
      ),
      borderColor: metric.color,
      backgroundColor: 'transparent',
      tension: 0.4, borderWidth: 1.5, pointRadius: 0,
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
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', overflowY: 'auto', textAlign: 'left', fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box', zIndex: 99999 },
    
    // 헤더 (대시보드 모바일과 동일)
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E4EBF4', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100 },
    brandSection: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoIcon: { width: '28px', height: '28px', backgroundColor: '#4CB5F5', borderRadius: '6px', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
    logoText: { fontSize: '15px', fontWeight: '700', color: '#161C2D' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    topScore: { color: '#10B981', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' },
    hamburger: { fontSize: '20px', color: '#161C2D', cursor: 'pointer' },

    content: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#FFFFFF' },
    
    titleSection: { marginBottom: '4px' },
    title: { fontSize: '22px', fontWeight: '800', margin: 0, color: '#1A202C' },
    subtitle: { fontSize: '13px', color: '#90A0B7', margin: '6px 0 0 0' },

    filterGroup: { display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px', justifyContent: 'space-between', marginBottom: '8px' },
    filterBtn: (isActive) => ({ flex: 1, padding: '10px 0', fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#1A202C' : '#64748B', backgroundColor: isActive ? '#FFFFFF' : 'transparent', borderRadius: '10px', cursor: 'pointer', border: 'none', boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', textAlign: 'center' }),

    legendBar: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
    legendBadge: (color, isActive) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', backgroundColor: isActive ? color : '#F1F5F9', color: isActive ? '#FFFFFF' : '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }),
    dot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),

    // 2x2 인사이트 그리드
    insightGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' },
    insightCard: (bgColor, textColor) => ({ backgroundColor: bgColor, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }),
    cardTitle: (color) => ({ fontSize: '12px', fontWeight: '700', color: color, marginBottom: '8px' }),
    cardValue: (color) => ({ fontSize: '22px', fontWeight: '800', color: color, margin: '0 0 4px 0' }),
    cardSub: (color) => ({ fontSize: '11px', color: color, opacity: 0.8 }),

    // 기간 요약 리스트
    summaryListContainer: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4EBF4', padding: '0 20px', marginBottom: '8px' },
    summaryListItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
    summaryListLeft: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: '#4A5568' },
    summaryListRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
    summaryAvg: (color) => ({ fontSize: '14px', fontWeight: '800', color: color }),
    summaryRange: { fontSize: '11px', color: '#A0AEC0', fontWeight: '500' },

    // 모바일 차트 섹션
    chartSection: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4EBF4', padding: '20px', display: 'flex', flexDirection: 'column' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    chartTitle: { fontSize: '14px', fontWeight: '800', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '6px' },
    chartWrapper: { height: '220px', width: '100%' }
  };

  return (
    <div style={styles.wrapper}>
      {/* 1. 상단 헤더 */}
      <header style={styles.header}>
        <div style={styles.brandSection} onClick={() => navigate('/')}>
          <div style={styles.logoIcon}>~</div>
          <span style={styles.logoText}>Clean-Sync</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.topScore}>● 88</span>
          <span style={styles.hamburger}>☰</span>
        </div>
      </header>

      {/* 2. 본문 내용 */}
      <div style={styles.content}>
        
        {/* 타이틀 및 필터 */}
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
            // 피그마처럼 비활성일 땐 점(dot) 표시
            return (
              <div key={metric.id} style={styles.legendBadge(metric.color, isActive)} onClick={() => toggleMetric(metric.id)}>
                {!isActive && <div style={styles.dot(metric.color)}></div>}
                {metric.label}
              </div>
            );
          })}
        </div>

        {/* 2x2 인사이트 카드 (파스텔톤 매칭) */}
        <div style={styles.insightGrid}>
          <div style={styles.insightCard('#F0FDF4', '#16A34A')}>
            <div style={styles.cardTitle('#16A34A')}>최고 집중</div>
            <div style={styles.cardValue('#16A34A')}>22:09</div>
            <div style={styles.cardSub('#16A34A')}>지수 94점</div>
          </div>
          <div style={styles.insightCard('#FFFBEB', '#D97706')}>
            <div style={styles.cardTitle('#D97706')}>최고 CO₂</div>
            <div style={styles.cardValue('#D97706')}>03:49</div>
            <div style={styles.cardSub('#D97706')}>905 ppm</div>
          </div>
          <div style={styles.insightCard('#F0F9FF', '#0284C7')}>
            <div style={styles.cardTitle('#0284C7')}>쾌적 비율</div>
            <div style={styles.cardValue('#0284C7')}>100%</div>
            <div style={styles.cardSub('#0284C7')}>선택 기간</div>
          </div>
          <div style={styles.insightCard('#F5F3FF', '#7C3AED')}>
            <div style={styles.cardTitle('#7C3AED')}>평균 지수</div>
            <div style={styles.cardValue('#7C3AED')}>93점</div>
            <div style={styles.cardSub('#7C3AED')}>평균 소음 41 dB</div>
          </div>
        </div>

        {/* 수직 요약 리스트 */}
        <div style={styles.summaryListContainer}>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#F5A623')}></div> CO₂</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg('#F5A623')}>avg 878ppm</span>
              <span style={styles.summaryRange}>850~905ppm</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#E02020')}></div> 온도</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg('#E02020')}>avg 21.4°C</span>
              <span style={styles.summaryRange}>20.6~22.1°C</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#4A90E2')}></div> 습도</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg('#4A90E2')}>avg 49.8%</span>
              <span style={styles.summaryRange}>45~54%</span>
            </div>
          </div>
          <div style={styles.summaryListItem}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#8B572A')}></div> 소음</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg('#8B572A')}>avg 40.5dB</span>
              <span style={styles.summaryRange}>34~44dB</span>
            </div>
          </div>
          <div style={{...styles.summaryListItem, borderBottom: 'none'}}>
            <div style={styles.summaryListLeft}><div style={styles.dot('#6A737D')}></div> 미세먼지</div>
            <div style={styles.summaryListRight}>
              <span style={styles.summaryAvg('#6A737D')}>avg 14.1µg/m³</span>
              <span style={styles.summaryRange}>12.3~15.9µg/m³</span>
            </div>
          </div>
        </div>

        {/* 시계열 차트 영역 (맨 아래) */}
        <div style={styles.chartSection}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitle}>📊 시계열 차트 보기</div>
            <div style={{color: '#A0AEC0', fontSize: '18px', cursor: 'pointer'}}>^</div>
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