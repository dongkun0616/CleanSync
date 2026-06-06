export const AlarmTab = ({ settings, handleSettingChange, saveSettings }) => (
  <section className="settings-section">
    <h2>알림 설정</h2>
    <h3 className="left-title">알림 채널</h3>
    <p className="settings-desc">알림을 받을 방법을 선택하세요</p>
    <div className="settings-card">
      <div className="setting-row"><div><b>이메일 알림</b><p>임계값 초과 시 이메일로 알림을 받습니다</p></div><label className="switch"><input type="checkbox" checked={settings.emailAlert} onChange={(e) => handleSettingChange("emailAlert", e.target.checked)} /><span className="slider"></span></label></div>
      <div className="setting-row"><div><b>푸시 알림</b><p>모바일 앱 푸시 알림을 받습니다</p></div><label className="switch"><input type="checkbox" checked={settings.pushAlert} onChange={(e) => handleSettingChange("pushAlert", e.target.checked)} /><span className="slider"></span></label></div>
      <div className="setting-row"><div><b>일일 리포트</b><p>매일 오전 9시 일일 환경 리포트를 받습니다</p></div><label className="switch"><input type="checkbox" checked={settings.dailyReport} onChange={(e) => handleSettingChange("dailyReport", e.target.checked)} /><span className="slider"></span></label></div>
      <div className="setting-row"><div><b>주간 리포트</b><p>매주 월요일 주간 분석 리포트를 받습니다</p></div><label className="switch"><input type="checkbox" checked={settings.weeklyReport} onChange={(e) => handleSettingChange("weeklyReport", e.target.checked)} /><span className="slider"></span></label></div>
    </div>
    
    {/* 수정된 부분: 임계값 설정 섹션 상단에 여백 추가 */}
    <div style={{ marginTop: '50px' }}>
      <h3 className="left-title">임계값 설정</h3>
      <p className="settings-desc">이 수치를 초과하면 알림이 발송됩니다</p>
      <div className="settings-card threshold-card">
        {[ { key: "co2", label: "CO₂ 임계값", min: 400, max: 2000, desc: "주의 범위 1000 ppm" },
           { key: "noise", label: "소음 임계값", min: 20, max: 90, desc: "주의 범위 55 dB" },
           { key: "temp", label: "최고 온도 임계값", min: 20, max: 35, desc: "주의 범위 27 ℃" },
           { key: "dust", label: "미세먼지 임계값", min: 0, max: 150, desc: "주의 범위 35 µg/m³" }].map(item => (
          <div className="threshold-item" key={item.key}>
            <div className="threshold-top"><b>{item.label}</b><span>{item.desc}</span></div>
            <input type="range" min={item.min} max={item.max} step="1" value={settings[item.key]} onChange={(e) => handleSettingChange(item.key, Number(e.target.value))} />
            <div className="threshold-labels"><span>{item.min}</span><span>...</span><span>{item.max}</span></div>
          </div>
        ))}
      </div>
    </div>
    
    <button className="save-setting-btn" onClick={saveSettings}>설정 저장</button>
  </section>
);

export const DeviceTab = ({ devices, deleteDevice, showDeviceModal, setShowDeviceModal, newDevice, setNewDevice, addDevice }) => (
  <section className="settings-section">
    <h2>등록된 기기</h2>
    <p className="settings-desc">현재 연결된 센서 기기 목록입니다</p>
    <div className="settings-card">
      {devices.map((device) => (
        <div className="setting-row device-row" key={device.id}>
          <div><b>{device.name}</b><p>{device.location} · {device.time}</p></div>
          <div className="device-actions">
            <span className={`device-status ${device.status === "연결됨" ? "good-text" : "offline-text"}`}>{device.status}</span>
            <button className="delete-device-btn" onClick={() => deleteDevice(device.id)}>삭제</button>
          </div>
        </div>
      ))}
    </div>
    <button className="save-setting-btn add-device-btn" onClick={() => setShowDeviceModal(true)}>＋ 새 기기 추가</button>
    {showDeviceModal && (
      <div className="device-modal-bg"><div className="device-modal"><h3>새 기기 추가</h3><p>추가할 센서 기기 정보를 입력하세요.</p>
        <label>기기 이름<input type="text" placeholder="예: 강의실 센서" value={newDevice.name} onChange={(e) => setNewDevice({...newDevice, name: e.target.value})} /></label>
        <label>설치 위치<input type="text" placeholder="예: 3층 301호" value={newDevice.location} onChange={(e) => setNewDevice({...newDevice, location: e.target.value})} /></label>
        <div className="device-modal-buttons"><button className="cancel-device-btn" onClick={() => setShowDeviceModal(false)}>취소</button><button className="confirm-device-btn" onClick={addDevice}>추가</button></div>
      </div></div>
    )}
  </section>
);

export const ProfileTab = ({ profile, handleProfileChange, saveProfile }) => (
  <section className="settings-section">
    <h2>프로필 정보</h2>
    <p className="settings-desc">계정 정보를 수정합니다</p>
    <div className="settings-card profile-card">
      <label>이름<input type="text" value={profile.name} onChange={(e) => handleProfileChange("name", e.target.value)} /></label>
      <label>이메일<input type="email" value={profile.email} onChange={(e) => handleProfileChange("email", e.target.value)} /></label>
      <label>주 사용 공간<input type="text" value={profile.space} onChange={(e) => handleProfileChange("space", e.target.value)} /></label>
    </div>
    <button className="save-setting-btn" onClick={saveProfile}>프로필 저장</button>
  </section>
);