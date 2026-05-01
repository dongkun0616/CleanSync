import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 상태 판단 로직 (미세먼지 & 초미세먼지 공용)
const getStatus = (type, val) => {
  const numericVal = Number(val); // 숫자로 변환하여 비교
  if (type === 'pm10') { // 미세먼지 기준
    if (numericVal > 150) return { label: '매우나쁨', color: '#ff4d4d' };
    if (numericVal > 80) return { label: '나쁨', color: '#ffcc00' };
    if (numericVal > 30) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  } else { // 초미세먼지 기준
    if (numericVal > 75) return { label: '매우나쁨', color: '#ff4d4d' };
    if (numericVal > 35) return { label: '나쁨', color: '#ffcc00' };
    if (numericVal > 15) return { label: '보통', color: '#00ffcc' };
    return { label: '좋음', color: '#38bdf8' };
  }
};

export default function TablePage() {
  const [data, setData] = useState({
    pm10: 0, pm25: 0, temp: 0, hum: 0, nos: 0, time: '--:--:--'
  });

  const fetchData = async () => {
    try {
      // 1. 실제 Node.js 서버 API 호출
      const res = await axios.get('[http://13.124.252.181:3000/home](http://13.124.252.181:3000/home)');
      
      // 2. 백엔드에서 SELECT * 로 가져온 데이터의 첫 번째 행(최신데이터) 사용
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        setData({
          pm10: latest.DUST_PM10 || 0,
          pm25: latest.DUST_PM25 || 0,
          temp: latest.TEMP || 0,
          hum: latest.HUM || 0,
          nos: latest.NOS || 0,
          // DB의 CREATE_AT 컬럼을 읽어오고 없으면 현재 시간 표시
          time: latest.CREATE_AT ? new Date(latest.CREATE_AT).toLocaleString() : new Date().toLocaleTimeString()
        });
      }
    } catch (e) {
      console.error("데이터 호출 에러:", e);
      // 에러 발생 시 기존처럼 랜덤 데이터 유지 (개발/테스트용)
      setData({
        pm10: Math.floor(Math.random() * 100),
        pm25: Math.floor(Math.random() * 50),
        temp: (Math.random() * 5 + 22).toFixed(1),
        hum: Math.floor(Math.random() * 10 + 45),
        nos: Math.floor(Math.random() * 20 + 30),
        time: "서버 연결 오류"
      });
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000); // 5초마다 갱신
    return () => clearInterval(timer);
  }, []);

  // 스타일 설정 (기존 스타일 유지)
  const tdStyle = { padding: '12px 20px', fontSize: '24px', borderBottom: '1px solid #e2e8f0' };
  const thStyle = { padding: '15px 20px', fontSize: '26px', backgroundColor: '#334155', color: 'white', textAlign: 'left' };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0f172a', fontSize: '40px', marginBottom: '25px', fontWeight: 'bold' }}>
        실시간 환경 데이터 모니터링 (Live)
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
        최종 갱신: {data.time}
      </div>
    </div>
  );
}