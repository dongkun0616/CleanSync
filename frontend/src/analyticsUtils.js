import { useEffect } from 'react';

export const TIME_FILTERS = ['1시간', '6시간', '12시간', '24시간'];

export const METRIC_CONFIG = [
  { id: 'score', label: '학습 지수', color: '#10B981', axis: 'y', field: 'spaceScore', unit: '점' },
  { id: 'humi', label: '습도', color: '#3B82F6', axis: 'y', field: 'humidity', unit: '%' },
  { id: 'co2', label: 'CO₂', color: '#F59E0B', axis: 'y1', field: 'co2', unit: 'ppm' },
  { id: 'temp', label: '온도', color: '#EF4444', axis: 'y2', field: 'temperature', unit: '°C' },
  { id: 'noise', label: '소음', color: '#8B5CF6', axis: 'y2', field: 'noise', unit: 'dB' },
  { id: 'dust', label: '미세먼지', color: '#64748B', axis: 'y2', children: ['pm10', 'pm25'] },
  { id: 'pm10', label: 'PM10', color: '#64748B', axis: 'y2', field: 'dustPm10', unit: '㎍/m³', hidden: true },
  { id: 'pm25', label: 'PM2.5', color: '#EC4899', axis: 'y2', field: 'dustPm25', unit: '㎍/m³', hidden: true }
];

export const SUMMARY_METRICS = [
  { label: 'CO₂', id: 'co2', color: '#F59E0B', unit: 'ppm', summaryKey: 'co2' },
  { label: '온도', id: 'temp', color: '#EF4444', unit: '°C', summaryKey: 'temperature' },
  { label: '습도', id: 'humi', color: '#3B82F6', unit: '%', summaryKey: 'humidity' },
  { label: '소음', id: 'noise', color: '#8B5CF6', unit: 'dB', summaryKey: 'noise' },
  { label: 'PM10', id: 'pm10', color: '#64748B', unit: '㎍/m³', summaryKey: 'dustPm10' },
  { label: 'PM2.5', id: 'pm25', color: '#EC4899', unit: '㎍/m³', summaryKey: 'dustPm25' }
];

const numberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const firstNumber = (item, keys) => {
  for (const key of keys) {
    const value = numberOrNull(item?.[key]);
    if (value !== null) return value;
  }
  return null;
};

const compactNumbers = (data, keys) => (
  data
    .map((item) => firstNumber(item, keys))
    .filter((value) => value !== null && value > 0)
);

const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getCongestionLabel = (noiseAvg) => {
  if (noiseAvg === null) return '데이터 없음';
  if (noiseAvg <= 10) return '여유';
  if (noiseAvg <= 40) return '보통';
  return '혼잡';
};

export const getRangeCode = (filter) => {
  const rangeMap = { '1시간': '1h', '6시간': '6h', '12시간': '12h', '24시간': '24h' };
  return rangeMap[filter] || '6h';
};

export const getDisplayMetrics = () => METRIC_CONFIG.filter((metric) => !metric.hidden);

export const toggleMetricSelection = (prev, metricId) => (
  prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId]
);

export const getSelectedDatasetMetrics = (activeMetrics) => {
  const selected = new Set(activeMetrics);
  if (selected.has('dust')) {
    selected.add('pm10');
    selected.add('pm25');
  }
  return METRIC_CONFIG.filter((metric) => !metric.children && selected.has(metric.id));
};

export const generateLabels = (filter) => {
  const generatedLabels = [];
  const now = new Date();
  let hours = 6;
  const points = 24;

  if (filter === '1시간') hours = 1;
  else if (filter === '12시간') hours = 12;
  else if (filter === '24시간') hours = 24;

  const intervalMs = (hours * 60 * 60 * 1000) / points;
  for (let i = points; i >= 0; i -= 1) {
    const time = new Date(now.getTime() - i * intervalMs);
    generatedLabels.push(`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`);
  }

  return generatedLabels;
};

export const normalizeAnalyticsData = (rawData) => {
  const chart = Array.isArray(rawData?.chart) ? rawData.chart : [];
  const labels = chart.map((item) => {
    const d = new Date(item.time);
    if (Number.isNaN(d.getTime())) return String(item.time || '').substring(11, 16);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const metrics = {
    score: chart.map((item) => firstNumber(item, ['spaceScore', 'score']) || 0),
    co2: chart.map((item) => firstNumber(item, ['co2', 'CO2']) || 0),
    temp: chart.map((item) => firstNumber(item, ['temperature', 'temp']) || 0),
    humi: chart.map((item) => firstNumber(item, ['humidity', 'humi', 'hum']) || 0),
    noise: chart.map((item) => firstNumber(item, ['noise', 'nos']) || 0),
    pm10: chart.map((item) => firstNumber(item, ['dustPm10', 'pm10']) || 0),
    pm25: chart.map((item) => firstNumber(item, ['dustPm25', 'pm25']) || 0)
  };

  return {
    raw: rawData || {},
    chart,
    labels,
    metrics,
    summary: rawData?.summary || {},
    insights: rawData?.insights || [],
    count: rawData?.count ?? chart.length
  };
};

export const buildChartData = (analyticsData, activeMetrics, fallbackLabels) => {
  const labels = analyticsData?.labels?.length > 0 ? analyticsData.labels : fallbackLabels;
  const datasets = getSelectedDatasetMetrics(activeMetrics).map((metric) => ({
    id: metric.id,
    label: metric.label,
    data: analyticsData?.metrics?.[metric.id] || [],
    borderColor: metric.color,
    backgroundColor: 'transparent',
    yAxisID: metric.axis,
    tension: metric.id === 'pm25' ? 0.36 : 0.3,
    borderWidth: metric.id === 'pm25' ? 2.2 : 2.5,
    borderDash: metric.id === 'pm25' ? [6, 4] : undefined,
    pointRadius: 0,
    pointHoverRadius: 6
  }));

  return { labels, datasets };
};

export const buildStatistics = (analyticsData) => {
  const data = analyticsData?.chart || [];
  if (!data.length) return null;

  const getStats = (keys, unit) => {
    const values = compactNumbers(data, keys);
    if (values.length === 0) return { avg: 0, min: 0, max: 0, unit, hasData: false };
    return {
      avg: average(values),
      min: Math.min(...values),
      max: Math.max(...values),
      unit,
      hasData: true
    };
  };

  return {
    score: getStats(['spaceScore', 'score'], '점'),
    co2: getStats(['co2', 'CO2'], 'ppm'),
    temp: getStats(['temperature', 'temp'], '°C'),
    humi: getStats(['humidity', 'humi', 'hum'], '%'),
    noise: getStats(['noise', 'nos'], 'dB'),
    pm10: getStats(['dustPm10', 'pm10'], '㎍/m³'),
    pm25: getStats(['dustPm25', 'pm25'], '㎍/m³')
  };
};

export const buildSummaryCards = (analyticsData) => {
  const data = analyticsData?.chart || [];
  const summary = analyticsData?.summary || {};
  const totalPeopleValues = compactNumbers(data, ['wifiCount', 'WIFI_COUNT', 'peopleCount', 'population', 'visitorCount']);
  const stayValues = compactNumbers(data, ['avgStayMinutes', 'stayMinutes', 'stayTime', 'durationMinutes']);
  const noiseValues = compactNumbers(data, ['noise', 'nos']);
  const pm10Values = compactNumbers(data, ['dustPm10', 'pm10']);
  const pm25Values = compactNumbers(data, ['dustPm25', 'pm25']);

  const totalPeople = totalPeopleValues.length ? totalPeopleValues.reduce((sum, value) => sum + value, 0) : null;
  const avgStay = average(stayValues);
  const avgNoise = average(noiseValues);
  const pm10Avg = summary.dustPm10?.avg ?? average(pm10Values);
  const pm25Avg = summary.dustPm25?.avg ?? average(pm25Values);

  return [
    {
      label: '총 유동인구',
      val: totalPeople === null ? '데이터 없음' : `${Math.round(totalPeople).toLocaleString()}명`,
      sub: totalPeople === null ? 'WIFI_COUNT 미수신' : `측정 ${totalPeopleValues.length}건 합계`,
      color: '#10B981'
    },
    {
      label: '평균 체류시간',
      val: avgStay === null ? '데이터 없음' : `${avgStay.toFixed(1)}분`,
      sub: avgStay === null ? '체류시간 필드 미수신' : '선택 기간 평균',
      color: '#3B82F6'
    },
    {
      label: '혼잡도',
      val: getCongestionLabel(avgNoise),
      sub: avgNoise === null ? '소음 데이터 없음' : `평균 소음 ${avgNoise.toFixed(1)}dB`,
      color: avgNoise === null ? '#94A3B8' : avgNoise <= 10 ? '#10B981' : avgNoise <= 40 ? '#F59E0B' : '#EF4444'
    },
    {
      label: '미세먼지',
      val: pm10Avg === null && pm25Avg === null ? '데이터 없음' : `PM10 ${Number(pm10Avg || 0).toFixed(1)}`,
      sub: pm25Avg === null ? 'PM2.5 데이터 없음' : `PM2.5 ${Number(pm25Avg).toFixed(1)}㎍/m³`,
      color: '#64748B'
    }
  ];
};

export const getSummaryAverage = (analyticsData, item, statistics) => {
  const backendAvg = analyticsData?.summary?.[item.summaryKey]?.avg;
  if (backendAvg !== undefined && backendAvg !== null) return backendAvg;
  const statAvg = statistics?.[item.id]?.avg;
  return statAvg === undefined || statAvg === null ? 0 : statAvg.toFixed(1);
};

export const usePreventZoom = () => {
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const handleKeyDown = (e) => {
      const key = String(e.key).toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(key)) e.preventDefault();
    };
    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
};
