// src/utils/getColor.js
export const getAirQualityColor = (value) => {
  if (value <= 30) return "text-green-500";  // 좋음
  if (value <= 80) return "text-yellow-500"; // 보통/주의
  return "text-red-500";                    // 위험
};

export const getAirQualityBg = (value) => {
  if (value <= 30) return "bg-green-500";
  if (value <= 80) return "bg-yellow-500";
  return "bg-red-500";
};