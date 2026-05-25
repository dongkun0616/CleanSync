import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardMobPage = () => {
  // 실시간 수치 상태 관리
  const [sensorData, setSensorData] = useState({
    score: 88, co2: 862.5, noise: 39.6, temp: 21.9, humi: 52.3, pm10: 18.5
  });

  // 미니 차트용 배열 데이터
  const [chartDataList, setChartDataList] = useState({
    co2: Array(10).fill(860), noise: Array(10).fill(40), temp: Array(10).fill(22), humi: Array(10).fill(52), pm10: Array(10).fill(18)
  });

  const getChartOptions = (min, max) => ({
    responsive: true, maintainAspectRatio: false,
    scales: { y: { display: false, min, max }, x: { display: false } },
    plugins: { legend: { display: false } },
    elements: { line: { tension: 0.4, borderWidth: 1.5 }, point: { radius: 0 } }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextCO2 = parseFloat((Math.random() * (870 - 850) + 850).toFixed(1));
      const nextNoise = parseFloat((Math.random() * (42 - 38) + 38).toFixed(1));
      const nextTemp = parseFloat((Math.random() * (22.5 - 21.5) + 21.5).toFixed(1));
      const nextHumi = parseFloat((Math.random() * (55 - 50) + 50).toFixed(1));
      const nextPm10 = parseFloat((Math.random() * (20 - 16) + 16).toFixed(1));

      setSensorData({ score: 88, co2: nextCO2, noise: nextNoise, temp: nextTemp, humi: nextHumi, pm10: nextPm10 });
      setChartDataList(prev => ({
        co2: [...prev.co2, nextCO2].slice(-10),
        noise: [...prev.noise, nextNoise].slice(-10),
        temp: [...prev.temp, nextTemp].slice(-10),
        humi: [...prev.humi, nextHumi].slice(-10),
        pm10: [...prev.pm10, nextPm10].slice(-10),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const createChartData = (dataArray, color) => ({
    labels: Array(dataArray.length).fill(''),
    datasets: [{ fill: true, data: dataArray, borderColor: color, backgroundColor: color === '#10B981' ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)' }],
  });

  // 모바일 뷰포트 고정 및 정렬 (기본 CSS 간섭 완벽 차단)
  const styles = {
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflowY: 'auto', textAlign: 'left', fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box', zIndex: 99999 },
    
    // 피그마 상단 네비게이션 바 (헤더)
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E4EBF4', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100 },
    brandSection: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoIcon: { width: '28px', height: '28px', backgroundColor: '#4393F9', borderRadius: '6px', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
    logoText: { fontSize: '15px', fontWeight: '700', color: '#161C2D' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    topScore: { color: '#10B981', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' },
    hamburger: { fontSize: '20px', color: '#161C2D', cursor: 'pointer' },

    // 콘텐츠 스크롤 바디
    content: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' },
    mainTitleSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: '20px', fontWeight: '700', margin: 0, color: '#161C2D' },
    subtitle: { fontSize: '12px', color: '#90A0B7', margin: '4px 0 0 0' },
    liveBadge: { backgroundColor: '#F0F9F4', color: '#137333', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #D5ECD9' },
    heroScoreBox: { backgroundColor: '#EBF5FF', color: '#1E40AF', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #CCE3FF', textAlign: 'center' },

    // 피그마 대응: 2열 모바일 카드 그리드 레이아웃
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', width: '100%' },
    sensorCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #E4EBF4', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#90A0B7', fontWeight: '600', marginBottom: '12px' },
    cardValue: { fontSize: '22px', fontWith: '700', color: '#161C2D', margin: 0, fontWeight: 'bold' },
    cardUnit: { fontSize: '11px', color: '#90A0B7', fontWeight: 'normal', marginLeft: '2px' },
    chartContainer: { height: '40px', marginTop: '12px', width: '100%' },
    
    footer: { textAlign: 'center', fontSize: '11px', color: '#A0AEC0', marginTop: 'auto', padding: '20px 0', borderTop: '1px solid #E4EBF4' }
  };

  return (
    <div style={styles.wrapper}>
      {/* 1. 피그마 상단바 구현 */}
      <header style={styles.header}>
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>~</div>
          <span style={styles.logoText}>Clean-Sync</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.topScore}>● {sensorData.score}</span>
          <span style={styles.hamburger}>☰</span>
        </div>
      </header>

      {/* 2. 모바일 메인 본문 */}
      <div style={styles.content}>
        <div style={styles.mainTitleSection}>
          <div>
            <h1 style={styles.title}>실시간 대시보드</h1>
            <p style={styles.subtitle}>모든 센서 수치를 한눈에 비교 분석합니다</p>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-end'}}>
            <div style={styles.liveBadge}>LIVE</div>
            <div style={styles.heroScoreBox}>{sensorData.score} <span style={{fontWeight:'normal', fontSize:'11px', color:'#6B7A99'}}>/ 100</span></div>
          </div>
        </div>

        {/* 3. 피그마 모바일 전용 2열 카드 배열 */}
        <div style={styles.cardGrid}>
          
          {/* CO2 카드 */}
          <div style={styles.sensorCard}>
            <div style={styles.cardHeader}><span>💨 CO₂</span><span style={{color:'#D97706'}}>주의</span></div>
            <h2 style={styles.cardValue}>{sensorData.co2}<span style={styles.cardUnit}>ppm</span></h2>
            <div style={styles.chartContainer}>
              <Line data={createChartData(chartDataList.co2, '#F59E0B')} options={getChartOptions(400, 950)} />
            </div>
          </div>

          {/* 소음 카드 */}
          <div style={styles.sensorCard}>
            <div style={styles.cardHeader}><span>🔊 소음</span><span style={{color:'#10B981'}}>양호</span></div>
            <h2 style={styles.cardValue}>{sensorData.noise}<span style={styles.cardUnit}>dB</span></h2>
            <div style={styles.chartContainer}>
              <Line data={createChartData(chartDataList.noise, '#10B981')} options={getChartOptions(30, 60)} />
            </div>
          </div>

          {/* 온도 카드 */}
          <div style={styles.sensorCard}>
            <div style={styles.cardHeader}><span>🌡️ 온도</span><span style={{color:'#10B981'}}>양호</span></div>
            <h2 style={styles.cardValue}>{sensorData.temp}<span style={styles.cardUnit}>°C</span></h2>
            <div style={styles.chartContainer}>
              <Line data={createChartData(chartDataList.temp, '#10B981')} options={getChartOptions(15, 30)} />
            </div>
          </div>

          {/* 습도 카드 */}
          <div style={styles.sensorCard}>
            <div style={styles.cardHeader}><span>💧 습도</span><span style={{color:'#10B981'}}>양호</span></div>
            <h2 style={styles.cardValue}>{sensorData.humi}<span style={styles.cardUnit}>%</span></h2>
            <div style={styles.chartContainer}>
              <Line data={createChartData(chartDataList.humi, '#10B981')} options={getChartOptions(30, 70)} />
            </div>
          </div>

          {/* 미세먼지 카드 (마지막 행 배치) */}
          <div style={styles.sensorCard}>
            <div style={styles.cardHeader}><span>☁️ 미세먼지</span><span style={{color:'#F59E0B'}}>주의</span></div>
            <h2 style={styles.cardValue}>{sensorData.pm10}<span style={styles.cardUnit}>µg/m³</span></h2>
            <div style={styles.chartContainer}>
              <Line data={createChartData(chartDataList.pm10, '#F59E0B')} options={getChartOptions(0, 40)} />
            </div>
          </div>

        </div>

        <footer style={styles.footer}>
          마지막 업데이트: 오전 4:04:34
        </footer>
      </div>
    </div>
  );
};

export default DashboardMobPage;