import { useState } from "react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  };

  return (
    <div className="app">
      <div className="mobile-header">
        <div className="mobile-logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12H7L9 6L13 18L15 12H21"
                stroke="white"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

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
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12H7L9 6L13 18L15 12H21"
                stroke="white"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

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

      <main className="main">
        {activePage === "home" && (
          <>
            <div className="mobile-hero">
              <div className="mobile-status">
                ● {sensorData.status}
              </div>

              <h1>{sensorData.score}</h1>

              <p>학습 지수</p>

              <div className="mobile-ai-box">
                ⚡ 현재 학습 환경이 최적입니다. 집중력을 유지하세요!
              </div>
            </div>

            <div
              className="gauge"
              style={{ "--percent": sensorData.score }}
            >
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
                  학습 지수 <b>{sensorData.score}점</b>으로 현재 환경이 매우
                  쾌적 상태입니다.
                </span>
              </div>

              <div className="ai-card">
                <b>✨ AI 가이드</b>

                <p>{sensorData.aiGuide}</p>
              </div>

              <div className="mobile-title">주요 센서</div>

              <div className="sensor-grid">

                {/* CO2 */}
                <div className="sensor orange">
                  <span className="sensor-icon co2-icon">
                    <span className="co2-cloud">☁</span>
                    <span className="co2-text">CO₂</span>
                  </span>

                  <span className="sensor-label">CO₂</span>

                  <b>{sensorData.co2}</b>

                  <span className="unit"> ppm</span>
                </div>

                {/* 소음 */}
                <div className="sensor green">
                  <span className="sensor-icon">🔊</span>

                  <span className="sensor-label">소음</span>

                  <b>{sensorData.noise}</b>

                  <span className="unit"> dB</span>
                </div>

                {/* 온도 */}
                <div className="sensor green">
                  <span className="sensor-icon">🌡️</span>

                  <span className="sensor-label">온도</span>

                  <b>{sensorData.temp}</b>

                  <span className="unit"> ℃</span>
                </div>

                {/* 습도 */}
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
                  미세먼지{" "}
                  <span className="dust">
                    {sensorData.dust} µg/m³
                  </span>
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
          <div className="page-box">
            <h1>설정</h1>
            <p>환경 설정 페이지입니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
