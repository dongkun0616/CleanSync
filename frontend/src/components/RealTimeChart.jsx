import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Filler 추가됨
} from 'chart.js';

// Chart.js 필수 요소 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Filler 등록됨
);

const RealTimeChart = ({ dataPoints }) => {
  const data = {
    labels: dataPoints.map((_, index) => `${index + 1}초 전`),
    datasets: [
      {
        label: '미세먼지 농도 (PM10)',
        data: dataPoints,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Filler가 이 배경색을 채워줍니다
        tension: 0.4,
        fill: true, // 이 옵션이 Filler를 사용하게 합니다
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 150 },
    },
    animation: { duration: 500 },
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
};

export default RealTimeChart;