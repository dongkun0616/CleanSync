import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// [추가] 서비스 워커 등록 코드
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 여기서 경로를 '/sw.js'로 맞춰주세요!
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ 서비스 워커(sw.js) 등록 성공:', registration);
      })
      .catch((error) => {
        console.error('❌ 서비스 워커 등록 실패:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)