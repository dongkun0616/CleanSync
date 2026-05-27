import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ⭐ 페이지 이동 함수 불러오기
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardPage = () => {
  const navigate = useNavigate(); // ⭐ 페이지 이동 함수 세팅

  // 실시간 가상 데이터 상태 관리
  const [sensorData, setSensorData] = useState({
    score: 88, status: '매우 쾌적', co2: 846, noise: 43, temp: 22.3, humi: 52, pm10: 18,
  });

  // 각 그래프별 최근 30분 추이 데이터 배열
  const [chartDataList, setChartDataList] = useState({
    co2: Array(15).fill(0).map(() => Math.floor(Math.random() * (855 - 835) + 835)),
    noise: Array(15).fill(0).map(() => Math.floor(Math.random() * (45 - 41) + 41)),
    temp: Array(15).fill(0).map(() => parseFloat((Math.random() * (22.5 - 22.1) + 22.1).toFixed(1))),
    humi: Array(15).fill(0).map(() => Math.floor(Math.random() * (54 - 50) + 50)),
    pm10: Array(15).fill(0).map(() => Math.floor(Math.random() * (19 - 17) + 17)),
  });

  const getChartOptions = (min, max) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { display: false, min, max }, x: { display: false } },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    elements: {
      line: { tension: 0.4, borderWidth: 2.5 },
      point: { radius: 0, hoverRadius: 4 }
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextCO2 = Math.floor(Math.random() * (855 - 835 + 1)) + 835;
      const nextNoise = Math.floor(Math.random() * (45 - 41 + 1)) + 41;
      const nextTemp = parseFloat((Math.random() * (22.5 - 22.1) + 22.1).toFixed(1));
      const nextHumi = Math.floor(Math.random() * (54 - 50 + 1)) + 50;
      const nextPm10 = Math.floor(Math.random() * (19 - 17 + 1)) + 17;

      setSensorData({ score: 88, status: '매우 쾌적', co2: nextCO2, noise: nextNoise, temp: nextTemp, humi: nextHumi, pm10: nextPm10 });
      
      setChartDataList(prev => ({
        co2: [...prev.co2, nextCO2].slice(-15),
        noise: [...prev.noise, nextNoise].slice(-15),
        temp: [...prev.temp, nextTemp].slice(-15),
        humi: [...prev.humi, nextHumi].slice(-15),
        pm10: [...prev.pm10, nextPm10].slice(-15),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const createChartData = (dataArray, borderColor, bgColor) => ({
    labels: Array(dataArray.length).fill(''),
    datasets: [{ fill: true, data: dataArray, borderColor: borderColor, backgroundColor: bgColor }],
  });

  // 스타일 설정 (외부 CSS 간섭 원천 봉쇄)
  const styles = {
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#FFFFFF', textAlign: 'left', zIndex: 99999, fontFamily: '"Pretendard", sans-serif', boxSizing: 'border-box' },
    
    // 좌측 다크 네이비 사이드바
    sidebar: { width: '280px', minWidth: '280px', height: '100%', backgroundColor: '#161C2D', color: '#FFFFFF', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderRight: '1px solid #242D42' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
    logoIcon: { width: '32px', height: '32px', backgroundColor: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '18px', fontWeight: '700' },
    
    sidebarScoreCard: { backgroundColor: '#1F283D', borderRadius: '12px', padding: '20px', marginBottom: '32px', border: '1px solid #2D3954' },
    sidebarScoreHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#8F9BB3', marginBottom: '12px' },
    sidebarScoreValue: { fontSize: '46px', fontWeight: '800', color: '#FFFFFF', margin: 0 },
    sidebarStatusText: { fontSize: '16px', color: '#10B981', fontWeight: '600', marginTop: '8px' },
    
    navContainer: { display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 },
    // ⭐ 마우스 올리면 손가락 모양(cursor: pointer)으로 바뀌도록 수정
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', color: '#707E94', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#28334E', color: '#4393F9', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

    // 우측 메인 콘텐츠 영역
    mainPanel: { flex: 1, height: '100%', overflowY: 'auto', padding: '40px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFCFF' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' },
    headerTitle: { fontSize: '28px', fontWeight: '800', margin: 0, color: '#1A202C' },
    headerSubtitle: { fontSize: '14px', color: '#90A0B7', margin: '4px 0 0 0' },
    topLiveBadges: { display: 'flex', alignItems: 'center', gap: '8px' },
    topLiveBtn: { backgroundColor: '#F0F9F4', color: '#137333', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #D5ECD9' },
    topScoreBtn: { backgroundColor: '#EBF5FF', color: '#1E40AF', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #CCE3FF' },

    // 3열 레이아웃 (CO2, 소음, 온도)
    mainGridTop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px', width: '100%', boxSizing: 'border-box' },
    
    largeSensorCard: (topBorderColor) => ({
      backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E4EBF4', borderTop: `4px solid ${topBorderColor}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column'
    }),
    largeCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', color: '#718096', fontWeight: '600', marginBottom: '12px' },
    largeCardValue: { fontSize: '56px', fontWeight: '800', color: '#1A202C', margin: 0, lineHeight: 1, letterSpacing: '-1px' },
    largeCardUnit: { fontSize: '18px', color: '#90A0B7', fontWeight: 'normal', marginLeft: '6px' },
    largeChartContainer: { height: '110px', marginTop: '16px', width: '100%' },

    // 2열 레이아웃 (습도, 미세먼지)
    mainGridBottom: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', width: '100%', boxSizing: 'border-box', marginBottom: '28px' },

    // [위치 수정 완벽 반영] 모든 센서 그래프 아래 배치될 수평 요약 바
    horizontalSummaryBar: { 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '18px 36px', borderRadius: '14px', border: '1px solid #E4EBF4', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 14px rgba(0,0,0,0.015)'
    },
    summaryItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', color: '#4A5568' },
    summaryDot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),
    summaryValue: { color: '#1A202C', fontWeight: '800', marginLeft: '6px', fontSize: '16px' }
  };

  return (
    <div style={styles.wrapper}>
      {/* 1. 좌측 다크 네이비 사이드바 영역 */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>⚡</div>
          <div>
            <span style={styles.logoText}>Clean-Sync</span>
            <span style={{fontSize:'11px', color:'#6B7A99', display:'block', marginTop:'2px'}}>학습 환경 모니터</span>
          </div>
        </div>

        <div style={styles.sidebarScoreCard}>
          <div style={styles.sidebarScoreHeader}>
            <span>학습 지수</span>
            <div style={{color:'#10B981', fontWeight:'bold', fontSize:'12px'}}>● LIVE</div>
          </div>
          <h2 style={styles.sidebarScoreValue}>
            {sensorData.score}<span style={{fontSize:'18px', color:'#6B7A99', fontWeight:'normal'}}> / 100</span>
          </h2>
          <div style={styles.sidebarStatusText}>{sensorData.status}</div>
        </div>

        {/* ⭐ 각 메뉴 클릭 시 이동하도록 onClick 이벤트 연결 */}
        <nav style={styles.navContainer}>
          <div style={styles.navItem} onClick={() => navigate('/')}>🏠 홈</div>
          <div style={styles.navItemActive} onClick={() => navigate('/dashboard')}>📊 대시보드</div>
          <div style={styles.navItem} onClick={() => navigate('/analytics')}>📈 통계</div>
          <div style={styles.navItem}>⚙️ 설정</div>
        </nav>
      </aside>

      {/* 2. 우측 메인 판넬 영역 */}
      <main style={styles.mainPanel}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>실시간 대시보드</h1>
            <p style={styles.headerSubtitle}>모든 센서 수치를 한눈에 비교 분석합니다</p>
          </div>
          <div style={styles.topLiveBadges}>
            <div style={styles.topLiveBtn}>📡 LIVE</div>
            <div style={styles.topScoreBtn}>✨ {sensorData.score} / 100</div>
          </div>
        </header>

        {/* 3. 상단 3열 센서 그래프 카드 그룹 (CO2 | 소음 | 온도) */}
        <div style={styles.mainGridTop}>
          <div style={styles.largeSensorCard('#F59E0B')}>
            <div style={styles.largeCardHeader}>
              <span>💨 CO₂ <span style={{fontSize:'11px', color:'#90A0B7', fontWeight:'normal', marginLeft:'6px'}}>최근 30분</span></span>
              <span style={{color: '#D97706', fontSize: '13px', fontWeight: 'bold'}}>주의</span>
            </div>
            <h2 style={styles.largeCardValue}>{sensorData.co2}<span style={styles.largeCardUnit}>ppm</span></h2>
            <div style={styles.largeChartContainer}>
              <Line data={createChartData(chartDataList.co2, '#F59E0B', 'rgba(245, 158, 11, 0.03)')} options={getChartOptions(400, 950)} />
            </div>
          </div>

          <div style={styles.largeSensorCard('#10B981')}>
            <div style={styles.largeCardHeader}>
              <span>🔊 소음 <span style={{fontSize:'11px', color:'#90A0B7', fontWeight:'normal', marginLeft:'6px'}}>최근 30분</span></span>
              <span style={{color: '#10B981', fontSize: '13px', fontWeight: 'bold'}}>양호</span>
            </div>
            <h2 style={styles.largeCardValue}>{sensorData.noise}<span style={styles.largeCardUnit}>dB</span></h2>
            <div style={styles.largeChartContainer}>
              <Line data={createChartData(chartDataList.noise, '#10B981', 'rgba(16, 185, 129, 0.03)')} options={getChartOptions(30, 60)} />
            </div>
          </div>

          <div style={styles.largeSensorCard('#10B981')}>
            <div style={styles.largeCardHeader}>
              <span>🌡️ 온도 <span style={{fontSize:'11px', color:'#90A0B7', fontWeight:'normal', marginLeft:'6px'}}>최근 30분</span></span>
              <span style={{color: '#10B981', fontSize: '13px', fontWeight: 'bold'}}>양호</span>
            </div>
            <h2 style={styles.largeCardValue}>{sensorData.temp}<span style={styles.largeCardUnit}>°C</span></h2>
            <div style={styles.largeChartContainer}>
              <Line data={createChartData(chartDataList.temp, '#10B981', 'rgba(16, 185, 129, 0.03)')} options={getChartOptions(15, 30)} />
            </div>
          </div>
        </div>

        {/* 4. 중단 2열 센서 그래프 카드 그룹 (습도 | 미세먼지) */}
        <div style={styles.mainGridBottom}>
          <div style={styles.largeSensorCard('#10B981')}>
            <div style={styles.largeCardHeader}>
              <span>💧 습도 <span style={{fontSize:'11px', color:'#90A0B7', fontWeight:'normal', marginLeft:'6px'}}>최근 30분</span></span>
              <span style={{color: '#10B981', fontSize: '13px', fontWeight: 'bold'}}>양호</span>
            </div>
            <h2 style={styles.largeCardValue}>{sensorData.humi}<span style={styles.largeCardUnit}>%</span></h2>
            <div style={styles.largeChartContainer}>
              <Line data={createChartData(chartDataList.humi, '#10B981', 'rgba(16, 185, 129, 0.03)')} options={getChartOptions(30, 70)} />
            </div>
          </div>

          <div style={styles.largeSensorCard('#F59E0B')}>
            <div style={styles.largeCardHeader}>
              <span>☁️ 미세먼지 <span style={{fontSize:'11px', color:'#90A0B7', fontWeight:'normal', marginLeft:'6px'}}>최근 30분</span></span>
              <span style={{color: '#D97706', fontSize: '13px', fontWeight: 'bold'}}>주의</span>
            </div>
            <h2 style={styles.largeCardValue}>{sensorData.pm10}<span style={styles.largeCardUnit}>µg/m³</span></h2>
            <div style={styles.largeChartContainer}>
              <Line data={createChartData(chartDataList.pm10, '#F59E0B', 'rgba(245, 158, 11, 0.03)')} options={getChartOptions(0, 40)} />
            </div>
          </div>
        </div>

        {/* 5. 5개 그래프 카드 아래인 맨 밑바닥으로 요약 바 안착 */}
        <div style={styles.horizontalSummaryBar}>
          <div style={styles.summaryItem}><div style={styles.summaryDot('#F59E0B')}></div> CO₂ <span style={styles.summaryValue}>{sensorData.co2} ppm</span></div>
          <div style={styles.summaryItem}><div style={styles.summaryDot('#10B981')}></div> 소음 <span style={styles.summaryValue}>{sensorData.noise} dB</span></div>
          <div style={styles.summaryItem}><div style={styles.summaryDot('#10B981')}></div> 온도 <span style={styles.summaryValue}>{sensorData.temp} °C</span></div>
          <div style={styles.summaryItem}><div style={styles.summaryDot('#10B981')}></div> 습도 <span style={styles.summaryValue}>{sensorData.humi} %</span></div>
          <div style={styles.summaryItem}><div style={styles.summaryDot('#F59E0B')}></div> 미세먼지 <span style={styles.summaryValue}>{sensorData.pm10} µg/m³</span></div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;