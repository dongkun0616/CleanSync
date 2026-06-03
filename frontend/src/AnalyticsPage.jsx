import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// 센서 색상 세팅 (새로운 디자인 톤에 맞춰 채도 살짝 조정)
const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#4CB5F5', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F6AD55', min: 850, max: 1100 },
  { id: 'temp', label: '온도', color: '#FC8181', min: 20, max: 30 },
  { id: 'humi', label: '습도', color: '#63B3ED', min: 40, max: 60 },
  { id: 'noise', label: '소음', color: '#B794F4', min: 30, max: 55 },
  { id: 'pm10', label: '미세먼지', color: '#A0AEC0', min: 10, max: 30 }
];

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('6시간');
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2']);

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
      y: { min: 0, max: 1200, ticks: { stepSize: 300, color: '#A0AEC0', font: { size: 11 } }, border: { display: false }, grid: { color: '#F1F5F9', borderDash: [5, 5] } },
      x: { ticks: { color: '#A0AEC0', font: { size: 10 } }, border: { display: false }, grid: { display: false } }
    },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(255,255,255,0.9)', titleColor: '#1A202C', bodyColor: '#4A5568', borderColor: '#E2E8F0', borderWidth: 1 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  // ⭐ 새로운 디자인 시스템 스타일 적용
  const styles = {
    // 배경: 연한 핑크빛 & 도트 패턴 적용
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#FCF3F3', backgroundImage: 'radial-gradient(#F5E1E1 2px, transparent 2px)', backgroundSize: '40px 40px', textAlign: 'left', zIndex: 99999, fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box' },
    
    // 사이드바: 다크 네이비 톤
    sidebar: { width: '280px', minWidth: '280px', height: '100%', backgroundColor: '#1A1B23', color: '#FFFFFF', padding: '24px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.05)' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 24px' },
    // 로고: 빨간색 원형 번개
    logoIcon: { width: '32px', height: '32px', backgroundColor: '#F56565', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' },
    logoText: { fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' },
    
    // 사이드바 점수 카드 (혼잡 45점 레드톤 반영)
    sidebarScoreCard: { backgroundColor: '#21232D', borderRadius: '16px', padding: '20px', margin: '0 24px 32px 24px', border: '1px solid rgba(255,255,255,0.05)' },
    sidebarScoreValue: { fontSize: '48px', fontWeight: '800', color: '#F56565', margin: '8px 0 4px 0', lineHeight: 1 },
    
    navContainer: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
    navItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', color: '#707E94', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    // 활성화된 메뉴: 레드 라인 + 레드 텍스트
    navItemActive: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: '#232530', color: '#F56565', fontSize: '15px', fontWeight: '800', cursor: 'pointer', borderLeft: '4px solid #F56565' },

    mainPanel: { flex: 1, height: '100%', overflowY: 'auto', padding: '40px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', width: '100%' },
    headerTitle: { fontSize: '28px', fontWeight: '800', margin: 0, color: '#1A202C' },
    headerSubtitle: { fontSize: '14px', color: '#718096', margin: '8px 0 0 0' },
    
    filterGroup: { display: 'flex', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    filterBtn: (isActive) => ({ padding: '8px 20px', fontSize: '14px', fontWeight: isActive ? '700' : '500', color: isActive ? '#F56565' : '#718096', backgroundColor: isActive ? '#FFF5F5' : 'transparent', borderRadius: '8px', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }),

    legendBar: { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
    legendBadge: (color, isActive) => ({ 
      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', 
      borderRadius: '24px', border: isActive ? `none` : '1px solid #E2E8F0', 
      backgroundColor: isActive ? color : '#FFFFFF', color: isActive ? '#FFFFFF' : '#4A5568', 
      fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
      boxShadow: isActive ? `0 4px 12px ${color}40` : '0 2px 8px rgba(0,0,0,0.02)'
    }),
    dot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),

    contentLayout: { display: 'flex', gap: '24px', flex: 1, minHeight: 0 },
    
    // 카드 공통 스타일 (더 둥글게, 화이트 배경, 부드러운 그림자)
    cardBase: { backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', padding: '28px', display: 'flex', flexDirection: 'column' },
    
    chartSection: { flex: '7' },
    chartContainer: { flex: 1, width: '100%', minHeight: '400px' },
    
    insightSection: { flex: '3', display: 'flex', flexDirection: 'column', gap: '16px' },
    insightMainTitle: { fontSize: '20px', fontWeight: '800', color: '#1A202C', marginBottom: '4px', paddingLeft: '4px' },
    
    // 내부 작은 카드들
    insightCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #F1F5F9', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', marginBottom: '8px' },
    cardValue: (color) => ({ fontSize: '26px', fontWeight: '800', color: color, margin: '0 0 6px 0', letterSpacing: '-0.5px' }),
    cardDesc: { fontSize: '13px', color: '#718096', lineHeight: '1.5', margin: 0 },
    
    summaryListRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '12px 0', borderBottom: '1px solid #F1F5F9' },
    summaryListLabel: { display: 'flex', alignItems: 'center', gap: '10px', color: '#4A5568', fontWeight: '600' },
    summaryListValue: { fontWeight: '800', color: '#1A202C' }
  };

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>⚡</div>
          <div><span style={styles.logoText}>Clean-Sync</span><span style={{fontSize:'11px', color:'#718096', display:'block', marginTop:'2px', fontWeight:'500'}}>학습 환경 모니터</span></div>
        </div>
        
        {/* ⭐ 새로운 45점 혼잡 모드 반영 */}
        <div style={styles.sidebarScoreCard}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#A0AEC0', fontWeight:'600'}}>
            <span>종합 지수</span><span style={{color:'#10B981', fontWeight:'bold'}}>● LIVE</span>
          </div>
          <h2 style={styles.sidebarScoreValue}>45</h2>
          <div style={{fontSize:'15px', color:'#F56565', fontWeight:'700', textAlign:'right'}}>혼잡</div>
        </div>
        
        <nav style={styles.navContainer}>
          <div style={styles.navItem} onClick={() => navigate('/')}>🏠 홈</div>
          <div style={styles.navItem} onClick={() => navigate('/dashboard')}>📊 대시보드</div>
          {/* ⭐ 활성화 메뉴 디자인 변경 (레드 라인) */}
          <div style={styles.navItemActive}>📈 통계</div>
          <div style={styles.navItem}>⚙️ 설정</div>
        </nav>
      </aside>

      <main style={styles.mainPanel}>
        <div style={styles.headerArea}>
          <div>
            <h1 style={styles.headerTitle}>통계 및 기록</h1>
            <p style={styles.headerSubtitle}>과거 기록을 통해 패턴을 분석합니다</p>
          </div>
          <div style={styles.filterGroup}>
            {['1시간', '6시간', '12시간', '24시간'].map(time => (
              <button key={time} style={styles.filterBtn(timeFilter === time)} onClick={() => handleFilterClick(time)}>{time}</button>
            ))}
          </div>
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

        <div style={styles.contentLayout}>
          {/* 차트 영역 (새로운 cardBase 스타일 적용) */}
          <section style={{...styles.cardBase, ...styles.chartSection}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C' }}>📊 시계열 데이터</div>
              <div style={{fontSize: '13px', color: '#A0AEC0', fontWeight: '500'}}>72개 데이터 포인트</div>
            </div>
            <div style={styles.chartContainer}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          {/* 인사이트 영역 */}
          <section style={styles.insightSection}>
            <div style={styles.insightMainTitle}>⭐ 인사이트</div>
            
            <div style={styles.cardBase} padding="24px">
              <div style={styles.insightCard}><div style={{...styles.cardTop, color: '#10B981'}}>최고 집중 시간대</div><h3 style={styles.cardValue('#10B981')}>10:45</h3><p style={styles.cardDesc}>학습 지수 94점으로 가장 높은 집중력을 보인 시간입니다.</p></div>
              <div style={{...styles.insightCard, marginTop: '16px'}}><div style={{...styles.cardTop, color: '#ED8936'}}>최고 CO₂ 발생 시점</div><h3 style={styles.cardValue('#ED8936')}>16:40</h3><p style={styles.cardDesc}>CO₂ 1013 ppm으로 환기가 필요했던 시점입니다.</p></div>
              <div style={{...styles.insightCard, marginTop: '16px'}}><div style={{...styles.cardTop, color: '#4299E1'}}>쾌적 환경 비율</div><h3 style={styles.cardValue('#4299E1')}>100%</h3><p style={styles.cardDesc}>선택 기간 중 100%의 시간이 쾌적한 환경이었습니다.</p></div>
              
              <div style={{marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed #F1F5F9'}}>
                <div style={{fontSize: '15px', fontWeight: '700', color: '#4A5568', marginBottom: '16px'}}>기간 요약</div>
                <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#F6AD55')}></span> CO₂</span><span style={styles.summaryListValue}>avg 959.4</span></div>
                <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#FC8181')}></span> 온도</span><span style={styles.summaryListValue}>avg 23.1</span></div>
                <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#63B3ED')}></span> 습도</span><span style={styles.summaryListValue}>avg 40.9</span></div>
                <div style={{...styles.summaryListRow, borderBottom: 'none', paddingBottom: 0}}><span style={styles.summaryListLabel}><span style={styles.dot('#A0AEC0')}></span> 미세먼지</span><span style={styles.summaryListValue}>avg 5.6</span></div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;