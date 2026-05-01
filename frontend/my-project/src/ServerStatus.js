import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ServerStatus() {
  const [status, setStatus] = useState('checking');

  const check = async () => {
    try {
      const res = await axios.get('[http://13.124.252.181:3000/test](http://13.124.252.181:3000/test)');
      if (res.status === 200) setStatus('online');
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      borderRadius: '15px', 
      backgroundColor: status === 'online' ? '#ecfdf5' : '#fef2f2',
      border: `2px solid ${status === 'online' ? '#10b981' : '#ef4444'}`,
      textAlign: 'center'
    }}>
      <h3 style={{ margin: 0, color: status === 'online' ? '#065f46' : '#991b1b' }}>
        {status === 'online' ? '🟢 SYSTEM ONLINE' : '🔴 SYSTEM OFFLINE'}
      </h3>
    </div>
  );
}