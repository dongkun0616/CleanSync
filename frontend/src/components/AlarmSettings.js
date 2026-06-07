import React from 'react';

const PUBLIC_VAPID_KEY = 'BGTWnSnAk3mh4n1KQAqWtLr9TlwfAfDO4S-nN2Gxd9It8hjB2BQLrqzpM425XTeEY37llGeOSmHdKvooxDJLt98'; // 아까 생성한 키

function AlarmSettings() {

  // VAPID 키 변환 함수
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribe = async () => {
    // 1. 서비스 워커 등록
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // 2. 푸시 구독 요청
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // 3. 서버(Node.js)로 구독 정보 전송
    await fetch('http://localhost:3001/api/save-subscription', { // 본인의 Node.js 주소
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    alert('알림이 설정되었습니다!');
  };

  return (
    <div>
      <h3>알림 설정</h3>
      <button onClick={handleSubscribe}>푸시 알림 켜기</button>
    </div>
  );
}

export default AlarmSettings;