import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 매개변수에 기본값(default)을 설정하여 에러를 방지했습니다.
const Sidebar = ({ 
  theme = { color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' }, 
  score = 0, 
  statusText = '로딩 중...', 
  formatTime = () => '--:--:--', 
  lastUpdate = null 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: '홈', sub: '현재 상태', path: '/' },
    { label: '대시보드', sub: '실시간 센서', path: '/dashboard' },
    { label: '통계', sub: '기록 분석', path: '/analytics' },
    { label: '설정', sub: '환경 설정', path: '/settings' },
  ];

  return (
    <aside style={{
      width: '230px', minWidth: '230px', height: '100%',
      background: 'linear-gradient(180deg, #0F1623 0%, #161C2D 100%)',
      color: '#FFF', padding: '28px 20px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* 로고 */}
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

      {/* 학습 지수 카드 */}
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
            {score}
          </span>
          <span style={{ fontSize: '14px', color: '#4A5568' }}>/ 100</span>
        </div>
        <div style={{ fontSize: '14px', color: theme.color, fontWeight: '700', marginTop: '8px' }}>
          {statusText}
        </div>
      </div>

      {/* 내비게이션 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {menuItems.map(({ label, sub, path }) => {
          const isActive = location.pathname === path;
          return (
            <div key={label} onClick={() => navigate(path)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
              background: isActive ? `linear-gradient(90deg, ${theme.color}22, transparent)` : 'transparent',
              borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent',
              transition: 'all 0.2s ease',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#6B7A99' }}>{label}</div>
                <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '1px' }}>{sub}</div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* 마지막 업데이트 */}
      <div style={{ fontSize: '10px', color: '#3D4F6E', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        마지막 업데이트 {formatTime(lastUpdate)}
      </div>
    </aside>
  );
};

export default Sidebar;