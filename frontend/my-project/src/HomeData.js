import React, { useState, useEffect } from 'react';
import axios from 'axios';

const getStatus = (type, val) => {
  const numericVal = Number(val);
  if (type === 'pm10') {
    if (numericVal > 150) return { label: '매우나쁨', color: '#ff4d4d' };
    if (numericVal > 80) return { label: '나쁨', color: '#ffcc00' };
    if (numericVal > 30) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  } else {
    if (numericVal > 75) return { label: '매우나쁨', color: '#ff4d4d' };
    if (numericVal > 35) return { label: '나쁨', color: '#ffcc00' };
    if (numericVal > 15) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  }
};

export default function TablePage() {
  const [data, setData] = useState({
    pm10: 0, pm25: 0, temp: 0, hum: 0, nos: 0, time: '연결 중...'
  });
  const [fade, setFade] = useState(false); // 데이터 갱신 시 깜빡임 효과용

  const fetchData = async () => {
    try {
      // 주소 뒤에 타임스탬프를 붙여 브라우저가 항상 새로운 데이터를 가져오게 강제함
      const res = await axios.get(`/api/home?t=${new Date().getTime()}`);
      
      if (res.data && res.data.length > 0) {
        const latest = res.data[0]; 
        
        // 데이터가 실제로 바뀌었을 때만 애니메이션 효과를 줍니다.
        setFade(true);
        setTimeout(() => setFade(false), 500);

        setData({
          pm10: parseFloat(latest.DUST_PM10 || 0).toFixed(2),
          pm25: parseFloat(latest.DUST_PM25 || 0).toFixed(2),
          temp: parseFloat(latest.TEMP || 0).toFixed(1),
          hum: parseFloat(latest.HUM || 0).toFixed(1),
          nos: parseFloat(latest.NOS || 0).toFixed(2),
          time: latest.CREATE_AT 
            ? new Date(latest.CREATE_AT).toLocaleString('ko-KR') 
            : "시간 정보 없음"
        });
      }
    } catch (e) {
      console.error("데이터 호출 에러:", e);
      setData(prev => ({ ...prev, time: "서버 연결 오류 (확인 중...)" }));
    }
  };

  useEffect(() => {
    fetchData(); // 처음 로드 시 실행
    const timer = setInterval(fetchData, 5000); // 5초마다 '자동'으로 최신 id 데이터 가져옴
    return () => clearInterval(timer);
  }, []);

  const tdStyle = { padding: '12px 20px', fontSize: '24px', borderBottom: '1px solid #e2e8f0' };
  const thStyle = { padding: '15px 20px', fontSize: '26px', backgroundColor: '#334155', color: 'white', textAlign: 'left' };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '40px', fontWeight: 'bold', margin: 0 }}>
          실시간 환경 데이터 모니터링 (Live)
        </h1>
        {/* 실시간 작동 중임을 알리는 깜빡이는 인디케이터 */}
        <div style={{
          marginLeft: '20px', width: '12px', height: '12px', borderRadius: '50%',
          backgroundColor: '#22c55e', animation: 'pulse 1.5s infinite'
        }} />
      </div>
      
      <div style={{ 
        backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        opacity: fade ? 0.7 : 1, transition: 'opacity 0.3s' // 갱신 시 살짝 흐려졌다가 밝아짐
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>측정 항목</th>
              <th style={thStyle}>현재 수치</th>
              <th style={thStyle}>상태 및 단위</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>미세먼지 (PM10)</td>
              <td style={{ ...tdStyle, fontSize: '32px', fontWeight: '900', color: getStatus('pm10', data.pm10).color }}>{data.pm10}</td>
              <td style={tdStyle}>{getStatus('pm10', data.pm10).label} (µg/m³)</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>초미세먼지 (PM2.5)</td>
              <td style={{ ...tdStyle, fontSize: '32px', fontWeight: '900', color: getStatus('pm25', data.pm25).color }}>{data.pm25}</td>
              <td style={tdStyle}>{getStatus('pm25', data.pm25).label} (µg/m³)</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>대기 온도</td>
              <td style={{ ...tdStyle, color: '#f97316', fontWeight: 'bold' }}>{data.temp}</td>
              <td style={tdStyle}>°C</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>대기 습도</td>
              <td style={{ ... ...tdStyle, color: '#06b6d4', fontWeight: 'bold' }}>{data.hum}</td>
              <td style={tdStyle}>%</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>주변 소음</td>
              <td style={{ ...tdStyle, color: '#8b5cf6', fontWeight: 'bold' }}>{data.nos}</td>
              <td style={tdStyle}>dB</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'right', color: '#64748b', fontSize: '20px', fontWeight: '500' }}>
        자동 업데이트 중 (5초 간격) | 최종 갱신: {data.time}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
}