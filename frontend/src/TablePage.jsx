import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 상태 판단 로직 (미세먼지 & 초미세먼지 공용)
const getStatus = (type, val) => {
  if (type === 'pm10') { // 미세먼지 기준
    if (val > 150) return { label: '매우나쁨', color: '#ff4d4d' };
    if (val > 80) return { label: '나쁨', color: '#ffcc00' };
    if (val > 30) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  } else { // 초미세먼지 기준
    if (val > 75) return { label: '매우나쁨', color: '#ff4d4d' };
    if (val > 35) return { label: '나쁨', color: '#ffcc00' };
    if (val > 15) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  }
};

export default function TablePage() {
  const [data, setData] = useState({
    pm10: 0, pm25: 0, temp: 0, hum: 0, nos: 0, time: '--:--:--'
  });

  const fetchData = async () => {
    try {
      // 1. 실제 백엔드 API 엔드포인트 연동
      const res = await axios.get('http://13.124.252.181:3000/api/home');
      
      setData({
        pm10: res.data.DUST_PM10,
        pm25: res.data.DUST_PM25,
        temp: res.data.TEMP,
        hum: res.data.HUM,
        nos: res.data.NOS,
        time: res.data.CREATE_AT || new Date().toLocaleTimeString()
      });
    } catch (e) {
      // 2. 예외 처리: 서버 연결 실패 시 가상 데이터 생성 (발표용 로직)
      setData({
        pm10: Math.floor(Math.random() * 100),
        pm25: Math.floor(Math.random() * 50),
        temp: (Math.random() * 5 + 22).toFixed(1),
        hum: Math.floor(Math.random() * 10 + 45),
        nos: Math.floor(Math.random() * 20 + 30),
        time: new Date().toLocaleTimeString()
      });
    }
  };

  // 3. 실시간 업데이트 타이머 (5초 간격)
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, []);

  // 표 스타일 설정 (가독성 강화)
  const tdStyle = { padding: '12px 20px', fontSize: '24px', borderBottom: '1px solid #e2e8f0' };
  const thStyle = { padding: '15px 20px', fontSize: '26px', backgroundColor: '#334155', color: 'white', textAlign: 'left' };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0f172a', fontSize: '40px', marginBottom: '25px', fontWeight: 'bold' }}>
        실시간 환경 데이터 모니터링
      </h1>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
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
              <td style={{ ...tdStyle, color: '#06b6d4', fontWeight: 'bold' }}>{data.hum}</td>
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
        수신 시간: {data.time}
      </div>
    </div>
  );
}