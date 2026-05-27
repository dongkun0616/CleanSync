import "./SettingsPage.css";

function Settings() {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>설정</h2>
        <p>사용자 환경에 맞게 시스템을 맞춤 설정합니다</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-menu">
          <div className="settings-menu-item active">알림 설정</div>
          <div className="settings-menu-item">기기 관리</div>
          <div className="settings-menu-item">프로필 수정</div>
        </aside>

        <main className="settings-content">
          <h3>알림 설정</h3>
          <p className="section-desc">알림을 받을 방법을 선택하세요</p>

          <div className="setting-card">
            {[
              ["이메일 알림", "위험값 감지 시 이메일로 알림을 받습니다", true],
              ["푸시 알림", "모바일 앱 푸시 알림을 받습니다", false],
              ["일일 리포트", "매일 오전 9시 일일 환경 리포트를 받습니다", true],
              ["주간 리포트", "매주 월요일 주간 분석 리포트를 받습니다", false],
            ].map((item, index) => (
              <div className="notify-row" key={index}>
                <div>
                  <strong>{item[0]}</strong>
                  <span>{item[1]}</span>
                </div>
                <button className={`toggle ${item[2] ? "on" : ""}`}>
                  <span></span>
                </button>
              </div>
            ))}
          </div>

          <h3 className="mt">임계값 설정</h3>
          <p className="section-desc">이 수치를 초과하면 알림이 발송됩니다</p>

          <div className="threshold-card">
            <Threshold title="CO₂ 임계값" value="1000 ppm" min="400 ppm" max="2000 ppm" good="양호 ≤800" warn="주의 ≤1000" percent="38" />
            <Threshold title="소음 임계값" value="55 dB" min="20 dB" max="90 dB" good="양호 ≤45" warn="주의 ≤55" percent="52" />
            <Threshold title="최고 온도 임계값" value="27 °C" min="20°C" max="35°C" good="양호 ≤24" warn="주의 ≤27" percent="48" />
            <Threshold title="미세먼지 임계값" value="35 µg/m³" min="0 µg/m³" max="150 µg/m³" good="양호 ≤15" warn="주의 ≤35" percent="24" />
          </div>

          <button className="save-btn">설정 저장</button>
        </main>
      </div>
    </div>
  );
}

function Threshold({ title, value, min, max, good, warn, percent }) {
  return (
    <div className="threshold-item">
      <div className="threshold-top">
        <strong>{title}</strong>
        <span>주의 범위 {value}</span>
      </div>

      <div className="range">
        <div className="range-fill" style={{ width: `${percent}%` }}></div>
        <div className="range-dot" style={{ left: `${percent}%` }}></div>
      </div>

      <div className="range-labels">
        <span>{min}</span>
        <span>{good}</span>
        <span>{warn}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default Settings;
