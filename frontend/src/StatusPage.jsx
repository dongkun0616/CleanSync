import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StatusPage() {
  const [status, setStatus] = useState('Checking...');
  const [lastCheck, setLastCheck] = useState('--:--:--');

  const checkServer = async () => {
    try {
      // 팀장님이 말씀하신 서버 테스트 엔드포인트
      const res = await axios.get('http://13.124.252.181:3000/api/test');
      
      if (res.status === 200) {
        setStatus('ONLINE (정상)');
      } else {
        setStatus('UNSTABLE (불안정)');
      }
    } catch (e) {
      setStatus('OFFLINE (연결 불가)');
    }
    setLastCheck(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkServer();
    const timer = setInterval(checkServer, 10000); // 상태 체크는 10초마다
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '36px', color: '#334155' }}>System Server Status</h1>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '40px', 
        borderRadius: '20px',
        backgroundColor: status.includes('ONLINE') ? '#ecfdf5' : '#fef2f2',
        border: `2px solid ${status.includes('ONLINE') ? '#10b981' : '#ef4444'}`
      }}>
        <h2 style={{ 
          fontSize: '48px', 
          color: status.includes('ONLINE') ? '#059669' : '#dc2626',
          margin: '0'
        }}>
          {status}
        </h2>
        <p style={{ marginTop: '20px', fontSize: '20px', color: '#64748b' }}>
          마지막 확인 시간: {lastCheck}
        </p>
      </div>

      <button 
        onClick={checkServer}
        style={{
          marginTop: '30px',
          padding: '12px 24px',
          fontSize: '18px',
          backgroundColor: '#334155',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        지금 즉시 재확인
      </button>

      <div style={{ marginTop: '40px' }}>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '18px' }}>
          ← 메인 모니터링 화면으로 돌아가기
        </a>
      </div>
    </div>
  );
}