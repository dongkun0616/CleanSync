import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 1. 설치한 axios 불러오기
import GaugeBar from './components/GaugeBar';
import RealTimeChart from './components/RealTimeChart';
import { getAirQualityColor } from './utils/getColor';

function App() {
  const [dustValue, setDustValue] = useState(0);
  const [history, setHistory] = useState([]);

  // 2. 데이터를 가져오는 함수 정의
  const fetchSensorData = async () => {
    try {
      // 실제 백엔드 API 주소를 여기에 넣습니다.
      // 지금은 테스트를 위해 임시 API 주소를 사용합니다.
      const response = await axios.get('https://api.test-server.com/sensor/dust'); 
      
      // 백엔드에서 준 데이터 구조가 { value: 45 } 라고 가정할 때
      const newValue = response.data.value; 

      setDustValue(newValue);
      setHistory((prev) => {
        const newHistory = [...prev, newValue];
        return newHistory.slice(-10); // 최근 10개만 유지
      });
    } catch (error) {
      console.error("데이터 연동 실패:", error);
      // 서버가 안 될 때를 대비해 0~100 사이 랜덤값을 대신 넣어서 확인해볼 수 있습니다.
      setDustValue(Math.floor(Math.random() * 100)); 
    }
  };

  // 3. 주기적으로 데이터 요청 (Polling)
  useEffect(() => {
    fetchSensorData(); // 처음 렌더링될 때 한 번 실행
    const interval = setInterval(fetchSensorData, 3000); // 3초마다 반복 실행
    
    return () => clearInterval(interval); // 컴포넌트가 사라질 때 타이머 해제
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">실시간 미세먼지 데이터 연동 테스트</h1>
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