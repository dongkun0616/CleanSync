import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── 1. 반원형 아크 게이지 컴포넌트 ──────────────────────────────────────────
const ArcGauge = ({ score, color }) => {
  const r = 120;
  const cx = 200;
  const cy = 200;
  const startAngle = -220;
  const endAngle = 40;
  const totalDeg = endAngle - startAngle;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const ptOnCircle = (deg) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  const arcPath = (from, to) => {
    const s = ptOnCircle(from);
    const e = ptOnCircle(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const filledEnd = startAngle + (score / 100) * totalDeg;
  const tickLabels = [0, 25, 50, 75, 100];

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', maxWidth: '400px' }}>
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      <path
        d={arcPath(startAngle, filledEnd)}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#glow)"
        style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />

      {tickLabels.map((val) => {
        const deg = startAngle + (val / 100) * totalDeg;
        const lp = ptOnCircle(deg);
        const op = { 
          x: cx + (r + 22) * Math.cos(toRad(deg)), 
          y: cy + (r + 22) * Math.sin(toRad(deg)) 
        };
        return (
          <g key={val}>
            <line
              x1={lp.x} y1={lp.y}
              x2={cx + (r - 8) * Math.cos(toRad(deg))}
              y2={cy + (r - 8) * Math.sin(toRad(deg))}
              stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"
            />
            <text
              x={op.x} y={op.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fill="#94A3B8"
              fontFamily="'DM Mono', monospace"
            >{val}</text>
          </g>
        );
      })}

      {(() => {
        const ep = ptOnCircle(filledEnd);
        return (
          <circle cx={ep.x} cy={ep.y} r="8" fill={color} filter="url(#glow)"
            style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        );
      })()}

      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="72" fontWeight="800"
        fill="#1A202C" fontFamily="'DM Mono', monospace"
        style={{ transition: 'all 0.5s ease' }}>
        {score}
      </text>
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="14"
        fill="#64748B" fontFamily="'Pretendard', sans-serif">
        학습 지수
      </text>
    </svg>
  );
};

// ── 2. 파티클 배경 컴포넌트 ─────────────────────────────────────────
const ParticleBg = ({ color }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NUM = 28;
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 5 + 2,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.25 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
};

// ── 3. 개별 센서 카드 컴포넌트 ───────────────────────────────────────────
const SensorCard = ({ icon, label, value, unit, color }) => (
  <div style={{
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '16px 18px',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      backgroundColor: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '11px', color: '#8FA3B1', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#1A202C', fontFamily: "'DM Mono', monospace" }}>
          {value}
        </span>
        <span style={{ fontSize: '12px', color: '#8FA3B1', fontWeight: '600' }}>{unit}</span>
      </div>
    </div>
  </div>
);

// ── 4. 메인 HomePage 컴포넌트 ────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sensorData, setSensorData] = useState({
    score: 0,
    statusText: '로딩 중...',
    aiMessage: '데이터를 불러오는 중입니다.',
    temperature: 0,
    humidity: 0,
    co2: 0,
    noise: 0,
    dustPm10: 0,
    dustPm25: 0,
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      // 환경 변수 기반 API 주소 사용
      const response = await fetch(`${process.env.REACT_APP_API_URL}/home`);
      const result = await response.json();

      if (result && result.success && result.data) {
        const d = result.data;
        setSensorData({
          score: Number(d.score || 0),
          statusText: d.statusText || '알 수 없음',
          aiMessage: d.aiMessage || '분석 중인 데이터가 없습니다.',
          temperature: Number(d.temperature || 0),
          humidity: Number(d.humidity || 0),
          co2: Number(d.co2 || 0),
          noise: Number(d.noise || 0),
          dustPm10: Number(d.dustPm10 || 0),
          dustPm25: Number(d.dustPm25 || 0),
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('데이터 통신 오류:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' };
    if (score >= 60) return { color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' };
    return { color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%)' };
  };
  const theme = getTheme(sensorData.score);

  const formatTime = (d) => d
    ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
    : '--:--:--';

  return (
    <div style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      display: 'flex', fontFamily: "'Pretendard', sans-serif",
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        
        * { font-family: 'Pretendard', sans-serif; }
      `}</style>

      {/* ── 사이드바 ── */}
      <aside style={{
        width: '230px', minWidth: '230px', height: '100%',
        background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)',
        color: '#FFF', padding: '28px 20px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: `0 4px 12px ${theme.color}44`,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Clean-Sync</div>
            <div style={{ fontSize: '10px', color: '#6B7A99', marginTop: '1px' }}>학습 환경 모니터</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', padding: '18px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7A99', fontWeight: '600' }}>학습 지수</span>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              LIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: theme.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", transition: 'all 0.5s ease' }}>
              {sensorData.score}
            </span>
            <span style={{ fontSize: '14px', color: '#4A5568' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>
            {sensorData.statusText}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '🏠', label: '홈', sub: '현재 상태', path: '/' },
            { icon: '📊', label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
            { icon: '📈', label: '통계', sub: '기록 분석', path: '/analytics' },
            { icon: '⚙️', label: '설정', sub: '환경 설정', path: '/settings' },
          ].map(({ icon, label, sub, path }) => {
            const isActive = location.pathname === path;
            return (
              <div key={label} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent',
                borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '1px' }}>{sub}</div>
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          마지막 업데이트 {formatTime(lastUpdate)}
        </div>
      </aside>

      {/* ── 메인 패널 ── */}
      <main style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: theme.bg, transition: 'background 0.8s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '48px', padding: '40px',
      }}>
        <ParticleBg color={theme.color} />

        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, width: '340px' }}>
          <ArcGauge score={sensorData.score} color={theme.color} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px', padding: '22px 26px',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.color, display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#8FA3B1', fontWeight: '600', letterSpacing: '0.5px' }}>현재 상태</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#1A202C', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              {sensorData.statusText}
            </div>
            <div style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
              학습 지수&nbsp;
              <strong style={{ color: theme.color }}>{sensorData.score}점</strong>
              &nbsp;으로 현재 환경이&nbsp;
              <strong style={{ color: theme.color }}>{sensorData.statusText}</strong>
              &nbsp;상태입니다.
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px', padding: '22px 26px',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>🤖</span>
              <span style={{ fontSize: '12px', color: '#8FA3B1', fontWeight: '600', letterSpacing: '0.5px' }}>AI 가이드</span>
            </div>
            <div style={{ fontSize: '14px', color: '#4A5568', lineHeight: 1.7 }}>
              {sensorData.aiMessage}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SensorCard icon="🌡️" label="온도" value={sensorData.temperature} unit="°C" color={theme.color} />
            <SensorCard icon="💧" label="습도" value={sensorData.humidity} unit="%" color={theme.color} />
            <SensorCard icon="💨" label="이산화탄소(CO₂)" value={sensorData.co2} unit="ppm" color={theme.color} />
            <SensorCard icon="🔊" label="소음" value={sensorData.noise} unit="dB" color={theme.color} />
            <SensorCard icon="😷" label="미세먼지(PM10)" value={sensorData.dustPm10} unit="㎍/㎥" color={theme.color} />
            <SensorCard icon="🌫️" label="초미세먼지(PM2.5)" value={sensorData.dustPm25} unit="㎍/㎥" color={theme.color} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;