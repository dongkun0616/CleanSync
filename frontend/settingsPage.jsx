
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./SettingsPage.css";

const API_BASE_URL = "http://13.124.252.181:3000";

const defaultSettings = {
  emailAlert: true,
  pushAlert: false,
  dailyReport: true,
  weeklyReport: false,
  co2: 1000,
  noise: 55,
  temp: 27,
  dust: 35,
};

const defaultProfile = {
  name: "123",
  email: "123@gmail.com",
  space: "101호",
};

const normalizeSettingsFromApi = (data) => ({
  emailAlert: Boolean(data.emailAlert ?? data.EMAIL_ALERT ?? data.emailAlertEnabled ?? data.email_alert ?? defaultSettings.emailAlert),
  pushAlert: Boolean(data.pushAlert ?? data.PUSH_ALERT ?? data.pushAlertEnabled ?? data.push_alert ?? defaultSettings.pushAlert),
  dailyReport: Boolean(data.dailyReport ?? data.DAILY_REPORT ?? data.dailyReportEnabled ?? data.daily_report ?? defaultSettings.dailyReport),
  weeklyReport: Boolean(data.weeklyReport ?? data.WEEKLY_REPORT ?? data.weeklyReportEnabled ?? data.weekly_report ?? defaultSettings.weeklyReport),
  co2: Number(data.co2 ?? data.CO2_THRESHOLD ?? data.co2Threshold ?? defaultSettings.co2),
  noise: Number(data.noise ?? data.NOS_THRESHOLD ?? data.noiseThreshold ?? data.nosThreshold ?? defaultSettings.noise),
  temp: Number(data.temp ?? data.TEMP_THRESHOLD ?? data.tempThreshold ?? defaultSettings.temp),
  dust: Number(data.dust ?? data.DUST_THRESHOLD ?? data.dustThreshold ?? defaultSettings.dust),
});

const normalizeProfileFromApi = (data) => ({
  name: data.name ?? data.USER_NAME ?? data.userName ?? defaultProfile.name,
  email: data.email ?? data.USER_EMAIL ?? data.userEmail ?? defaultProfile.email,
  space: data.space ?? data.USER_SPACE ?? data.userSpace ?? defaultProfile.space,
});

const createSettingsPayload = (settings) => ({
  emailAlert: settings.emailAlert,
  pushAlert: settings.pushAlert,
  dailyReport: settings.dailyReport,
  weeklyReport: settings.weeklyReport,
  co2: settings.co2,
  noise: settings.noise,
  temp: settings.temp,
  dust: settings.dust,

  EMAIL_ALERT: settings.emailAlert,
  PUSH_ALERT: settings.pushAlert,
  DAILY_REPORT: settings.dailyReport,
  WEEKLY_REPORT: settings.weeklyReport,
  CO2_THRESHOLD: settings.co2,
  NOS_THRESHOLD: settings.noise,
  TEMP_THRESHOLD: settings.temp,
  DUST_THRESHOLD: settings.dust,
});

const createProfilePayload = (profile) => ({
  name: profile.name,
  email: profile.email,
  space: profile.space,

  USER_NAME: profile.name,
  USER_EMAIL: profile.email,
  USER_SPACE: profile.space,
  userName: profile.name,
  userEmail: profile.email,
  userSpace: profile.space,
});


function SettingsPage() {
  const [settingTab, setSettingTab] = useState("alarm");
  const [mobileSettingPage, setMobileSettingPage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [settings, setSettings] = useState(defaultSettings);

  const [profile, setProfile] = useState(defaultProfile);

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

  const activeSetting = mobileSettingPage || settingTab;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);

        if (!response.ok) {
          throw new Error("설정 조회 실패");
        }

        const result = await response.json();
        const apiData = result.data || result;

        setSettings(normalizeSettingsFromApi(apiData));
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
      }
    };

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/profile`);

        if (!response.ok) {
          throw new Error("프로필 조회 실패");
        }

        const result = await response.json();
        const apiData = result.data || result;

        setProfile(normalizeProfileFromApi(apiData));
      } catch (error) {
        console.error("프로필 불러오기 실패:", error);
      }
    };

    const loadDevices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/devices`);

        if (!response.ok) {
          throw new Error("기기 조회 실패");
        }

        const result = await response.json();
        const apiData = result.data || result;

        if (Array.isArray(apiData)) {
          setDevices(apiData);
        }
      } catch (error) {
        console.error("기기 목록 불러오기 실패:", error);
      }
    };

    loadSettings();
    loadProfile();
    loadDevices();
  }, []);


  const handleSettingChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleProfileChange = (key, value) => {
    setProfile({
      ...profile,
      [key]: value,
    });
  };

  const saveSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createSettingsPayload(settings)),
      });

      if (!response.ok) {
        throw new Error("설정 저장 실패");
      }

      alert("설정이 서버에 저장되었습니다.");
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createProfilePayload(profile)),
      });

      if (!response.ok) {
        throw new Error("프로필 저장 실패");
      }

      alert("프로필이 서버에 저장되었습니다.");
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  const deleteDevice = (id) => {
    setDevices(devices.filter((device) => device.id !== id));
  };

  const addDevice = async () => {
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

    try {
      const response = await fetch(`${API_BASE_URL}/settings/devices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceName: device.name,
          deviceLocation: device.location,
          deviceStatus: device.status,
          devices: [...devices, device],
        }),
      });

      if (!response.ok) {
        throw new Error("기기 저장 실패");
      }

      setDevices([...devices, device]);
      setNewDevice({ name: "", location: "" });
      setShowDeviceModal(false);
    } catch (error) {
      console.error("기기 저장 실패:", error);
      alert("기기 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-mobile-top">
        <div className="settings-mobile-logo">
          <div className="settings-mobile-logo-icon">⚡</div>
          <b>Clean-Sync</b>
        </div>

        <div className="settings-mobile-right">
          <span className="settings-mobile-score">● 88</span>
          <button
            className="settings-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="settings-mobile-menu-panel">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive
                ? "settings-mobile-menu-item active"
                : "settings-mobile-menu-item"
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>⌂</span>
            <div>
              <b>홈</b>
              <p>현재 상태</p>
            </div>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "settings-mobile-menu-item active"
                : "settings-mobile-menu-item"
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>▦</span>
            <div>
              <b>대시보드</b>
              <p>실시간 센서</p>
            </div>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive
                ? "settings-mobile-menu-item active"
                : "settings-mobile-menu-item"
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>▥</span>
            <div>
              <b>통계</b>
              <p>기록 분석</p>
            </div>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive
                ? "settings-mobile-menu-item active"
                : "settings-mobile-menu-item"
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>⚙</span>
            <div>
              <b>설정</b>
              <p>환경 설정</p>
            </div>
          </NavLink>
        </div>
      )}

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
            <div className="mobile-setting-left">
              <div className="mobile-setting-icon">🔔</div>
              <div className="mobile-setting-text">
                <b>알림 설정</b>
                <p>임계값 및 알림 채널</p>
              </div>
            </div>
            <span>›</span>
          </div>

          <div
            className="mobile-setting-row"
            onClick={() => setMobileSettingPage("device")}
          >
            <div className="mobile-setting-left">
              <div className="mobile-setting-icon">⚙️</div>
              <div className="mobile-setting-text">
                <b>기기 관리</b>
                <p>센서 기기 등록/삭제</p>
              </div>
            </div>
            <span>›</span>
          </div>

          <div
            className="mobile-setting-row"
            onClick={() => setMobileSettingPage("profile")}
          >
            <div className="mobile-setting-left">
              <div className="mobile-setting-icon">👤</div>
              <div className="mobile-setting-text">
                <b>프로필 수정</b>
                <p>계정 정보 관리</p>
              </div>
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
              settingTab === "profile" ? "settings-tab active" : "settings-tab"
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
                      <input
                        type="checkbox"
                        checked={settings.emailAlert}
                        onChange={(e) =>
                          handleSettingChange("emailAlert", e.target.checked)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-row">
                    <div>
                      <b>푸시 알림</b>
                      <p>모바일 앱 푸시 알림을 받습니다</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.pushAlert}
                        onChange={(e) =>
                          handleSettingChange("pushAlert", e.target.checked)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-row">
                    <div>
                      <b>일일 리포트</b>
                      <p>매일 오전 9시 일일 환경 리포트를 받습니다</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.dailyReport}
                        onChange={(e) =>
                          handleSettingChange("dailyReport", e.target.checked)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-row">
                    <div>
                      <b>주간 리포트</b>
                      <p>매주 월요일 주간 분석 리포트를 받습니다</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.weeklyReport}
                        onChange={(e) =>
                          handleSettingChange("weeklyReport", e.target.checked)
                        }
                      />
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
                      step="1"
                      value={settings.co2}
                      onChange={(e) =>
                        handleSettingChange("co2", Number(e.target.value))
                      }
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
                      step="1"
                      value={settings.noise}
                      onChange={(e) =>
                        handleSettingChange("noise", Number(e.target.value))
                      }
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
                      step="1"
                      value={settings.temp}
                      onChange={(e) =>
                        handleSettingChange("temp", Number(e.target.value))
                      }
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
                      step="1"
                      value={settings.dust}
                      onChange={(e) =>
                        handleSettingChange("dust", Number(e.target.value))
                      }
                    />
                    <div className="threshold-labels">
                      <span>0 µg/m³</span>
                      <span>양호 ≤15</span>
                      <span>주의 ≤35</span>
                      <span>150 µg/m³</span>
                    </div>
                  </div>
                </div>

                <button className="save-setting-btn" onClick={saveSettings}>
                  설정 저장
                </button>
              </section>
            </>
          )}

          {activeSetting === "device" && (
            <section className="settings-section">
              <h2>등록된 기기</h2>
              <p className="settings-desc">현재 연결된 센서 기기 목록입니다</p>

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
                          setNewDevice({ ...newDevice, name: e.target.value })
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
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      handleProfileChange("name", e.target.value)
                    }
                  />
                </label>

                <label>
                  이메일
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      handleProfileChange("email", e.target.value)
                    }
                  />
                </label>

                <label>
                  주 사용 공간
                  <input
                    type="text"
                    value={profile.space}
                    onChange={(e) =>
                      handleProfileChange("space", e.target.value)
                    }
                  />
                </label>
              </div>

              <button className="save-setting-btn" onClick={saveProfile}>
                프로필 저장
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
