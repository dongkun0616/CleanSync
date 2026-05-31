import { useState } from "react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingTab, setSettingTab] = useState("alarm");
  const [mobileSettingPage, setMobileSettingPage] = useState(null);

  const [devices, setDevices] = useState([
    {
      id: 1,
      name: "교실 A 센서",
      location: "3층 301호",
      time: "방금 전",
      status: "연결됨",
    },
    {
      id: 2,
      name: "도서관 센서",
      location: "2층 열람실",
      time: "1분 전",
      status: "연결됨",
    },
    {
      id: 3,
      name: "복도 센서",
      location: "3층 복도",
      time: "2시간 전",
      status: "오프라인",
    },
  ]);

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
  });

  const [sensorData] = useState({
    score: 88,
    status: "매우 쾌적",
    aiGuide: "현재 학습 환경이 최적입니다. 집중력을 유지하세요!",
    co2: 835.8,
    noise: 44,
    temp: 22.2,
    hum: 51.6,
    dust: 16.6,
  });

  const changePage = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setMobileSettingPage(null);
  };

  const deleteDevice = (id) => {
    setDevices(devices.filter((device) => device.id !== id));
  };

  const addDevice = () => {
    if (newDevice.name.trim() === "" || newDevice.location.trim() === "") {
      alert("기기 이름과 설치 위치를 입력해주세요.");
      return;
    }

    const device = {
      id: Date.now(),
      name: newDevice.name,
      location: newDevice.location,
      time: "방금 전",
      status: "연결됨",
    };

    setDevices([...devices, device]);
    setNewDevice({ name: "", location: "" });
    setShowDeviceModal(false);
  };

  const activeSetting = mobileSettingPage || settingTab;

  return (
    <div className="app">
      <div className="mobile-header">
        <div className="mobile-logo">
          <div className="logo-icon">⌁</div>
          <span>Clean-Sync</span>
        </div>

        <div className="mobile-right">
          <span className="mobile-score">● {sensorData.score}</span>
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu-panel">
          <div
            className={
              activePage === "home"
                ? "mobile-menu-item active"
                : "mobile-menu-item"
            }
            onClick={() => changePage("home")}
          >
            <span className="mobile-menu-icon">⌂</span>
            <div>
              <b>홈</b>
              <p>현재 상태</p>
            </div>
          </div>

          <div
            className={
              activePage === "dashboard"
                ? "mobile-menu-item active"
                : "mobile-menu-item"
            }
            onClick={() => changePage("dashboard")}
          >
            <span className="mobile-menu-icon">▦</span>
            <div>
              <b>대시보드</b>
              <p>실시간 센서</p>
            </div>
          </div>

          <div
            className={
              activePage === "stats"
                ? "mobile-menu-item active"
                : "mobile-menu-item"
            }
            onClick={() => changePage("stats")}
          >
            <span className="mobile-menu-icon">▥</span>
            <div>
              <b>통계</b>
              <p>기록 분석</p>
            </div>
          </div>

          <div
            className={
              activePage === "settings"
                ? "mobile-menu-item active"
                : "mobile-menu-item"
            }
            onClick={() => changePage("settings")}
          >
            <span className="mobile-menu-icon">⚙</span>
            <div>
              <b>설정</b>
              <p>환경 설정</p>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">⌁</div>

          <div className="logo-text">
            <strong>Clean-Sync</strong>
            <span>학습 환경 모니터</span>
          </div>
        </div>

        <div className="score-box">
          <p>학습 지수</p>
          <div className="score-line">
            <h2>{sensorData.score}</h2>
            <span>/ 100</span>
          </div>
          <div className="status-text">{sensorData.status}</div>
        </div>

        <nav>
          <div
            className={activePage === "home" ? "menu active" : "menu"}
            onClick={() => changePage("home")}
          >
            홈 <span>현재 상태</span>
          </div>

          <div
            className={activePage === "dashboard" ? "menu active" : "menu"}
            onClick={() => changePage("dashboard")}
          >
            대시보드 <span>실시간 센서</span>
          </div>

          <div
            className={activePage === "stats" ? "menu active" : "menu"}
            onClick={() => changePage("stats")}
          >
            통계 <span>기록 분석</span>
          </div>

          <div
            className={activePage === "settings" ? "menu active" : "menu"}
            onClick={() => changePage("settings")}
          >
            설정 <span>환경 설정</span>
          </div>
        </nav>
      </aside>

      <main className={activePage === "settings" ? "main settings-main" : "main"}>
        {activePage === "home" && (
          <>
            <div className="mobile-hero">
              <div className="mobile-status">● {sensorData.status}</div>
              <h1>{sensorData.score}</h1>
              <p>학습 지수</p>
              <div className="mobile-ai-box">
                ⚡ 현재 학습 환경이 최적입니다. 집중력을 유지하세요!
              </div>
            </div>

            <div className="gauge" style={{ "--percent": sensorData.score }}>
              <div className="gauge-track"></div>
              <div className="gauge-fill"></div>

              <div className="circle">
                <h1>{sensorData.score}</h1>
                <p>학습 지수</p>
              </div>

              <div className="mark mark0">0</div>
              <div className="mark mark25">25</div>
              <div className="mark mark50">50</div>
              <div className="mark mark75">75</div>
              <div className="mark mark100">100</div>
            </div>

            <section className="info">
              <div className="status-card">
                <p>● 현재 상태</p>
                <h1>{sensorData.status}</h1>
                <span>
                  학습 지수 <b>{sensorData.score}점</b>으로 현재 환경이 매우 쾌적
                  상태입니다.
                </span>
              </div>

              <div className="ai-card">
                <b>✨ AI 가이드</b>
                <p>{sensorData.aiGuide}</p>
              </div>

              <div className="mobile-title">주요 센서</div>

              <div className="sensor-grid">
                <div className="sensor orange">
                  <span className="sensor-icon co2-icon">
                    <span className="co2-cloud">☁</span>
                    <span className="co2-text">CO₂</span>
                  </span>
                  <span className="sensor-label">CO₂</span>
                  <b>{sensorData.co2}</b>
                  <span className="unit"> ppm</span>
                </div>

                <div className="sensor green">
                  <span className="sensor-icon">🔊</span>
                  <span className="sensor-label">소음</span>
                  <b>{sensorData.noise}</b>
                  <span className="unit"> dB</span>
                </div>

                <div className="sensor green">
                  <span className="sensor-icon">🌡️</span>
                  <span className="sensor-label">온도</span>
                  <b>{sensorData.temp}</b>
                  <span className="unit"> ℃</span>
                </div>

                <div className="sensor green">
                  <span className="sensor-icon">💧</span>
                  <span className="sensor-label">습도</span>
                  <b>{sensorData.hum}</b>
                  <span className="unit"> %</span>
                </div>
              </div>

              <div className="mobile-title">기타 센서</div>

              <div className="other-sensor">
                <div>
                  온도 <span>{sensorData.temp} ℃</span>
                </div>
                <div>
                  습도 <span>{sensorData.hum} %</span>
                </div>
                <div>
                  미세먼지 <span className="dust">{sensorData.dust} µg/m³</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "dashboard" && (
          <div className="page-box">
            <h1>대시보드</h1>
            <p>실시간 센서 데이터를 보여주는 페이지입니다.</p>
          </div>
        )}

        {activePage === "stats" && (
          <div className="page-box">
            <h1>통계</h1>
            <p>기록 분석 데이터를 보여주는 페이지입니다.</p>
          </div>
        )}

        {activePage === "settings" && (
          <div className="settings-page">
            <div className="settings-header">
              <h1>설정</h1>
              <p>사용자 환경에 맞게 시스템을 맞춤 설정합니다</p>
            </div>

            {mobileSettingPage === null && (
              <div className="mobile-settings-list">
                <div
                  className="mobile-setting-row"
                  onClick={() => setMobileSettingPage("alarm")}
                >
                  <div className="mobile-setting-text">
                    <b>알림 설정</b>
                    <p>임계값 및 알림 채널</p>
                  </div>
                  <span>›</span>
                </div>

                <div
                  className="mobile-setting-row"
                  onClick={() => setMobileSettingPage("device")}
                >
                  <div className="mobile-setting-text">
                    <b>기기 관리</b>
                    <p>센서 기기 등록/삭제</p>
                  </div>
                  <span>›</span>
                </div>

                <div
                  className="mobile-setting-row"
                  onClick={() => setMobileSettingPage("profile")}
                >
                  <div className="mobile-setting-text">
                    <b>프로필 수정</b>
                    <p>계정 정보 관리</p>
                  </div>
                  <span>›</span>
                </div>
              </div>
            )}

            <div
              className={
                mobileSettingPage === null
                  ? "settings-layout mobile-detail-hidden"
                  : "settings-layout"
              }
            >
              <div className="settings-side-menu">
                <button
                  className={
                    settingTab === "alarm" ? "settings-tab active" : "settings-tab"
                  }
                  onClick={() => setSettingTab("alarm")}
                >
                  알림 설정
                  <span>임계값 및 알림 채널</span>
                </button>

                <button
                  className={
                    settingTab === "device" ? "settings-tab active" : "settings-tab"
                  }
                  onClick={() => setSettingTab("device")}
                >
                  기기 관리
                  <span>센서 기기 등록/삭제</span>
                </button>

                <button
                  className={
                    settingTab === "profile"
                      ? "settings-tab active"
                      : "settings-tab"
                  }
                  onClick={() => setSettingTab("profile")}
                >
                  프로필 수정
                  <span>계정 정보 관리</span>
                </button>
              </div>

              <div className="settings-content">
                {mobileSettingPage && (
                  <button
                    className="mobile-back"
                    onClick={() => setMobileSettingPage(null)}
                  >
                    ‹{" "}
                    {activeSetting === "alarm"
                      ? "알림 설정"
                      : activeSetting === "device"
                      ? "기기 관리"
                      : "프로필 수정"}
                  </button>
                )}

                {activeSetting === "alarm" && (
                  <>
                    <section className="settings-section">
                      <h2>알림 설정</h2>
                      <h3 className="left-title">알림 채널</h3>
                      <p className="settings-desc">알림을 받을 방법을 선택하세요</p>

                      <div className="settings-card">
                        <div className="setting-row">
                          <div>
                            <b>이메일 알림</b>
                            <p>임계값 초과 시 이메일로 알림을 받습니다</p>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-row">
                          <div>
                            <b>푸시 알림</b>
                            <p>모바일 앱 푸시 알림을 받습니다</p>
                          </div>
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-row">
                          <div>
                            <b>일일 리포트</b>
                            <p>매일 오전 9시 일일 환경 리포트를 받습니다</p>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>

                        <div className="setting-row">
                          <div>
                            <b>주간 리포트</b>
                            <p>매주 월요일 주간 분석 리포트를 받습니다</p>
                          </div>
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </section>

                    <section className="settings-section">
                      <h3 className="left-title">임계값 설정</h3>
                      <p className="settings-desc">
                        이 수치를 초과하면 알림이 발송됩니다
                      </p>

                      <div className="settings-card threshold-card">
                        <div className="threshold-item">
                          <div className="threshold-top">
                            <b>CO₂ 임계값</b>
                            <span>주의 범위 1000 ppm</span>
                          </div>
                          <input
                            type="range"
                            min="400"
                            max="2000"
                            defaultValue="1000"
                          />
                          <div className="threshold-labels">
                            <span>400 ppm</span>
                            <span>양호 ≤800</span>
                            <span>주의 ≤1000</span>
                            <span>2000 ppm</span>
                          </div>
                        </div>

                        <div className="threshold-item">
                          <div className="threshold-top">
                            <b>소음 임계값</b>
                            <span>주의 범위 55 dB</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="90"
                            defaultValue="55"
                          />
                          <div className="threshold-labels">
                            <span>20 dB</span>
                            <span>양호 ≤45</span>
                            <span>주의 ≤55</span>
                            <span>90 dB</span>
                          </div>
                        </div>

                        <div className="threshold-item">
                          <div className="threshold-top">
                            <b>최고 온도 임계값</b>
                            <span>주의 범위 27 ℃</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="35"
                            defaultValue="27"
                          />
                          <div className="threshold-labels">
                            <span>20 ℃</span>
                            <span>양호 ≤24</span>
                            <span>주의 ≤27</span>
                            <span>35 ℃</span>
                          </div>
                        </div>

                        <div className="threshold-item">
                          <div className="threshold-top">
                            <b>미세먼지 임계값</b>
                            <span>주의 범위 35 µg/m³</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="150"
                            defaultValue="35"
                          />
                          <div className="threshold-labels">
                            <span>0 µg/m³</span>
                            <span>양호 ≤15</span>
                            <span>주의 ≤35</span>
                            <span>150 µg/m³</span>
                          </div>
                        </div>
                      </div>

                      <button className="save-setting-btn">설정 저장</button>
                    </section>
                  </>
                )}

                {activeSetting === "device" && (
                  <section className="settings-section">
                    <h2>등록된 기기</h2>
                    <p className="settings-desc">
                      현재 연결된 센서 기기 목록입니다
                    </p>

                    <div className="settings-card">
                      {devices.map((device) => (
                        <div className="setting-row device-row" key={device.id}>
                          <div>
                            <b>{device.name}</b>
                            <p>
                              {device.location} · {device.time}
                            </p>
                          </div>

                          <div className="device-actions">
                            <span
                              className={
                                device.status === "연결됨"
                                  ? "device-status good-text"
                                  : "device-status offline-text"
                              }
                            >
                              {device.status}
                            </span>

                            <button
                              className="delete-device-btn"
                              onClick={() => deleteDevice(device.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="save-setting-btn add-device-btn"
                      onClick={() => setShowDeviceModal(true)}
                    >
                      ＋ 새 기기 추가
                    </button>

                    {showDeviceModal && (
                      <div className="device-modal-bg">
                        <div className="device-modal">
                          <h3>새 기기 추가</h3>
                          <p>추가할 센서 기기 정보를 입력하세요.</p>

                          <label>
                            기기 이름
                            <input
                              type="text"
                              placeholder="예: 강의실 센서"
                              value={newDevice.name}
                              onChange={(e) =>
                                setNewDevice({
                                  ...newDevice,
                                  name: e.target.value,
                                })
                              }
                            />
                          </label>

                          <label>
                            설치 위치
                            <input
                              type="text"
                              placeholder="예: 3층 301호"
                              value={newDevice.location}
                              onChange={(e) =>
                                setNewDevice({
                                  ...newDevice,
                                  location: e.target.value,
                                })
                              }
                            />
                          </label>

                          <div className="device-modal-buttons">
                            <button
                              className="cancel-device-btn"
                              onClick={() => setShowDeviceModal(false)}
                            >
                              취소
                            </button>

                            <button className="confirm-device-btn" onClick={addDevice}>
                              추가
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeSetting === "profile" && (
                  <section className="settings-section">
                    <h2>프로필 정보</h2>
                    <p className="settings-desc">계정 정보를 수정합니다</p>

                    <div className="settings-card profile-card">
                      <label>
                        이름
                        <input type="text" defaultValue="123" />
                      </label>

                      <label>
                        이메일
                        <input type="email" defaultValue="123@gmail.com" />
                      </label>

                      <label>
                        주 사용 공간
                        <input type="text" defaultValue="101호" />
                      </label>
                    </div>

                    <button className="save-setting-btn">프로필 저장</button>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
