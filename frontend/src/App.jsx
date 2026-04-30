import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GaugeBar from './components/GaugeBar';
import RealTimeChart from './components/RealTimeChart';
import { getAirQualityColor } from './utils/getColor';

function App() {
  const [dustValue, setDustValue] = useState(0);
  const [history, setHistory] = useState([]);

  const fetchSensorData = async () => {
    try {
      const response = await axios.get('https://api.test-server.com/sensor/dust'); 
      const newValue = response.data.value; 

      setDustValue(newValue);
      setHistory((prev) => {
        const newHistory = [...prev, newValue];
        return newHistory.slice(-10);
      });
    } catch (error) {
      console.error("데이터 연동 실패:", error);
      setDustValue(Math.floor(Math.random() * 100)); 
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-2">실시간 미세먼지 데이터 연동 테스트</h1>
      
      {/* 🟢 서버 작동중 문구 추가 - 녹색 포인트 컬러 사용 */}
      <p className="text-green-600 font-semibold mb-6 flex items-center">
        <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
        서버 작동중
      </p>

      <div className="flex gap-10">
        <div className="w-1/2 p-6 bg-white rounded-xl shadow">
          <h2 className="mb-4">현재 농도: <span className={getAirQualityColor(dustValue)}>{dustValue} µg/m³</span></h2>
          <GaugeBar value={dustValue} />
        </div>
        <div className="w-1/2 p-6 bg-white rounded-xl shadow">
          <h2>변화 추이</h2>
          <RealTimeChart dataPoints={history} />
        </div>
      </div>
    </div>
  );
}

export default App;