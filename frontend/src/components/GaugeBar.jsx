import { getAirQualityBg } from '../utils/getColor';

const GaugeBar = ({ value }) => {
  const colorClass = getAirQualityBg(value);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div 
        className={`h-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${Math.min((value / 150) * 100, 100)}%` }} 
      />
    </div>
  );
};

export default GaugeBar;