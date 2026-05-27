import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// 6개 센서의 기본 정보와 색상 세팅
const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#3CA4F6', min: 80, max: 98 },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', min: 850, max: 1100 },
  { id: 'temp', label: '온도', color: '#F56565', min: 20, max: 30 },
  { id: 'humi', label: '습도', color: '#4299E1', min: 40, max: 60 },
  { id: 'noise', label: '소음', color: '#9F7AEA', min: 30, max: 55 },
  { id: 'pm10', label: '미세먼지', color: '#718096', min: 10, max: 30 }
];

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('6시간');
  
  // ⭐ 어떤 버튼(그래프)이 켜져 있는지 추적하는 상태 (기본값: 학습지수, CO2 켜둠)
  const [activeMetrics, setActiveMetrics] = useState(['score', 'co2']);

  // 모든 센서의 24개 데이터 포인트를 랜덤 생성하는 함수
  const generateAllData = () => {
    return METRIC_CONFIG.map(metric => ({
      id: metric.id,
      label: metric.label,
      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (metric.max - metric.min) + metric.min)),
      borderColor: metric.color,
      backgroundColor: 'transparent',
      tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
    }));
  };

  // 전체 데이터 상태 (필터 누를 때마다 새로 생성됨)
  const [fullDatasets, setFullDatasets] = useState(generateAllData());

  const labels = Array.from({ length: 24 }, (_, i) => `${10 + Math.floor(i / 4)}:${(i % 4) * 15 || '00'}`);

  // ⭐ 버튼 클릭 시 해당 그래프 껐다 켰다 하는 함수
  const toggleMetric = (metricId) => {
    setActiveMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId) // 이미 켜져있으면 끄기
        : [...prev, metricId] // 꺼져있으면 켜기
    );
  };

  // 상단 시간 필터 클릭 시 데이터 새로고침
  const handleFilterClick = (time) => {
    setTimeFilter(time);
    setFullDatasets(generateAllData()); // 새 랜덤 데이터 생성
  };

  // ⭐ 실제 차트에 전달되는 데이터 (켜져있는 activeMetrics만 필터링해서 줌)
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
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const styles = {
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#FFFFFF', textAlign: 'left', zIndex: 99999, fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box' },
    sidebar: { width: '280px', minWidth: '280px', height: '100%', backgroundColor: '#161C2D', color: '#FFFFFF', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderRight: '1px solid #242D42' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
    logoIcon: { width: '32px', height: '32px', backgroundColor: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '18px', fontWeight: '700' },
    sidebarScoreCard: { backgroundColor: '#1F283D', borderRadius: '12px', padding: '20px', marginBottom: '32px', border: '1px solid #2D3954' },
    sidebarScoreValue: { fontSize: '46px', fontWeight: '800', color: '#FFFFFF', margin: '12px 0 8px 0' },
    
    navContainer: { display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', color: '#707E94', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#28334E', color: '#4393F9', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

    mainPanel: { flex: 1, height: '100%', overflowY: 'auto', padding: '40px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFCFF' },
    headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', width: '100%' },
    headerTitle: { fontSize: '28px', fontWeight: '800', margin: 0, color: '#1A202C' },
    headerSubtitle: { fontSize: '14px', color: '#90A0B7', margin: '8px 0 0 0' },
    
    filterGroup: { display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '4px' },
    filterBtn: (isActive) => ({ padding: '8px 16px', fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#1A202C' : '#64748B', backgroundColor: isActive ? '#FFFFFF' : 'transparent', borderRadius: '6px', cursor: 'pointer', border: 'none', boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }),

    // ⭐ 피그마 완벽 반영 범례(버튼) 스타일
    legendBar: { display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #E4EBF4', paddingBottom: '24px', flexWrap: 'wrap' },
    legendBadge: (color, isActive) => ({ 
      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', 
      borderRadius: '20px', border: isActive ? `1px solid ${color}` : '1px solid #E2E8F0', 
      backgroundColor: isActive ? color : '#FFFFFF', color: isActive ? '#FFFFFF' : '#4A5568', 
      fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none'
    }),
    dot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),

    contentLayout: { display: 'flex', gap: '24px', flex: 1, minHeight: 0 },
    chartSection: { flex: '7', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4EBF4', padding: '24px', display: 'flex', flexDirection: 'column' },
    chartContainer: { flex: 1, width: '100%', minHeight: '400px' },
    insightSection: { flex: '3', display: 'flex', flexDirection: 'column', gap: '16px' },
    insightCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4EBF4', padding: '20px' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '12px' },
    cardValue: (color) => ({ fontSize: '24px', fontWeight: '800', color: color, margin: '0 0 8px 0' }),
    cardDesc: { fontSize: '12px', color: '#718096', lineHeight: '1.5', margin: 0 },
    summaryListRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '10px' },
    summaryListLabel: { display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', fontWeight: '500' },
    summaryListValue: { fontWeight: '700', color: '#1A202C' }
  };

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>⚡</div>
          <div><span style={styles.logoText}>Clean-Sync</span><span style={{fontSize:'11px', color:'#6B7A99', display:'block', marginTop:'2px'}}>학습 환경 모니터</span></div>
        </div>
        <div style={styles.sidebarScoreCard}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#8F9BB3'}}><span>학습 지수</span><span style={{color:'#10B981', fontWeight:'bold'}}>● LIVE</span></div>
          <h2 style={styles.sidebarScoreValue}>88<span style={{fontSize:'18px', color:'#6B7A99', fontWeight:'normal'}}> / 100</span></h2>
          <div style={{fontSize:'14px', color:'#10B981', fontWeight:'bold'}}>매우 쾌적</div>
        </div>
        <nav style={styles.navContainer}>
          <div style={styles.navItem} onClick={() => navigate('/')}>🏠 홈</div>
          <div style={styles.navItem} onClick={() => navigate('/dashboard')}>📊 대시보드</div>
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

        {/* ⭐ 피그마 디자인 적용 & 토글 기능이 들어간 버튼들 */}
        <div style={styles.legendBar}>
          {METRIC_CONFIG.map(metric => {
            const isActive = activeMetrics.includes(metric.id);
            return (
              <div 
                key={metric.id} 
                style={styles.legendBadge(metric.color, isActive)}
                onClick={() => toggleMetric(metric.id)}
              >
                {!isActive && <div style={styles.dot(metric.color)}></div>}
                {metric.label}
              </div>
            );
          })}
        </div>

        <div style={styles.contentLayout}>
          <section style={styles.chartSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A202C' }}>📊 시계열 데이터</div>
              <div style={{fontSize: '12px', color: '#A0AEC0'}}>72개 데이터 포인트</div>
            </div>
            <div style={styles.chartContainer}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          <section style={styles.insightSection}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C', marginBottom: '8px' }}>⭐ 인사이트</div>
            <div style={styles.insightCard}><div style={{...styles.cardTop, color: '#10B981'}}>⭐ 최고 집중 시간대</div><h3 style={styles.cardValue('#10B981')}>10:45</h3><p style={styles.cardDesc}>학습 지수 94점으로 가장 높은 집중력을 보인 시간입니다.</p></div>
            <div style={styles.insightCard}><div style={{...styles.cardTop, color: '#F59E0B'}}>⚠️ 최고 CO₂ 발생 시점</div><h3 style={styles.cardValue('#F59E0B')}>16:40</h3><p style={styles.cardDesc}>CO₂ 1013 ppm으로 환기가 필요했던 시점입니다.</p></div>
            <div style={styles.insightCard}><div style={{...styles.cardTop, color: '#3B82F6'}}>📈 쾌적 환경 비율</div><h3 style={styles.cardValue('#3B82F6')}>100%</h3><p style={styles.cardDesc}>선택 기간 중 100%의 시간이 쾌적한 환경이었습니다.</p></div>
            <div style={{...styles.insightCard, backgroundColor: '#F8FAFC'}}>
              <div style={{...styles.cardTop, color: '#4A5568', marginBottom: '16px'}}>기간 요약</div>
              <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#F59E0B')}></span> CO₂</span><span style={styles.summaryListValue}>avg 959.4ppm</span></div>
              <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#F56565')}></span> 온도</span><span style={styles.summaryListValue}>avg 23.1°C</span></div>
              <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#4299E1')}></span> 습도</span><span style={styles.summaryListValue}>avg 40.9%</span></div>
              <div style={styles.summaryListRow}><span style={styles.summaryListLabel}><span style={styles.dot('#9F7AEA')}></span> 소음</span><span style={styles.summaryListValue}>avg 25.9dB</span></div>
              <div style={{...styles.summaryListRow, marginBottom: 0}}><span style={styles.summaryListLabel}><span style={styles.dot('#718096')}></span> 미세먼지</span><span style={styles.summaryListValue}>avg 5.6µg/m³</span></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;