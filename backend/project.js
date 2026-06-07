const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config();

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

function saveLog(message) {
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync("log.txt", log);
}

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

// 통계/대시보드 그래프용 로그 테이블
const LOG_TABLE = "statistics_logs";

// ================== 기본 API ==================
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다. /home, /dashboard, /analytics, /settings 로 접속하세요.");
});

// ================== 메인 홈 API (app_settings 연동 완료 버전) ==================
app.get("/home", (req, res) => {
  const { location } = req.query;
  const targetLocation = location || "기본";

  // 1. app_settings 테이블에서 기기가 '연결됨' 상태인지 확인합니다.
  const checkDeviceSql = `
    SELECT DEVICE_STATUS 
    FROM app_settings 
    WHERE DEVICE_NAME = ? AND DEVICE_STATUS = '연결됨'
    LIMIT 1
  `;

  getPool().query(checkDeviceSql, [targetLocation], (err, deviceResults) => {
    if (err) {
      console.error("홈 기기 상태 조회 오류:", err);
      saveLog(`홈 기기 상태 조회 오류: ${err.message}`);
      return res.status(500).json({ success: false, message: "DB 오류 발생" });
    }

    const isConnected = deviceResults && deviceResults.length > 0;

    if (!isConnected) {
      // 기기가 삭제되었거나 없다면 센서 데이터를 전송하지 않고 즉시 '연결 끊김' 응답
      return res.json({
        success: true,
        data: {
          deviceStatus: "연결 끊김",
          score: 0,
          statusText: "기기 연결 끊김",
          aiMessage: "기기가 연결되어 있지 않아 데이터를 불러올 수 없습니다.",
          co2: 0,
          noise: 0,
          temperature: 0,
          humidity: 0,
          dustPm10: 0,
          dustPm25: 0
        }
      });
    }

    // 2. 기기가 정상적으로 존재(연결)할 때만 실제 센서 데이터(home_status) 최신 1건 조회
    const sql = `
      SELECT *
      FROM home_status
      WHERE location = ?
      ORDER BY CREATE_AT DESC
      LIMIT 1
    `;

    getPool().query(sql, [targetLocation], (err, results) => {
      if (err) {
        console.error("홈 DB 오류:", err);
        saveLog(`홈 DB 오류: ${err.message}`);
        return res.status(500).json({ success: false, message: "DB 오류 발생" });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({ success: false, message: "데이터 없음" });
      }

      const data = results[0];

      res.json({
        success: true,
        data: {
          deviceStatus: "연결됨", 
          score: Number(data.SPACE_SCORE || 0),
          statusText: data.CST || "알 수 없음",
          statusLevel: data.STATUS_LEVEL || "알 수 없음",
          aiMessage: data.AI_MESSAGE || "데이터 없음",
          co2: Number(data.CO2 || 0),
          noise: Number(data.NOS || 0),
          temperature: Number(data.TEMP || 0),
          humidity: Number(data.HUM || 0),
          dustPm10: Number(data.DUST_PM10 || 0),
          dustPm25: Number(data.DUST_PM25 || 0),
          wifiCount: Number(data.WIFI_COUNT || 0),
          location: data.location || null,
          createdAt: data.CREATE_AT
        }
      });
    });
  });
});

// ================== 대시보드 API ==================
app.get("/dashboard", (req, res) => {
  const { location } = req.query;
  const targetLocation = location || "기본";
  
  const currentSql = `
    SELECT *
    FROM home_status
    WHERE location = ?
    ORDER BY CREATE_AT DESC
    LIMIT 1
  `;

  getPool().query(currentSql, [targetLocation], (err, currentResults) => {
    if (err) {
      console.error("대시보드 현재 데이터 조회 실패:", err);
      saveLog(`대시보드 현재 데이터 조회 실패: ${err.message}`);
      return res.status(500).json({ success: false, message: "대시보드 현재 데이터 조회 실패" });
    }

    const chartSql = `
      SELECT
        CO2, NOS, TEMP, HUM, DUST_PM10, DUST_PM25, CREATE_AT
      FROM ${LOG_TABLE}
      WHERE location = ?
      ORDER BY CREATE_AT DESC
      LIMIT 20
    `;

    getPool().query(chartSql, [targetLocation], (err, chartResults) => {
      if (err) {
        console.error("대시보드 차트 데이터 조회 실패:", err);
        saveLog(`대시보드 차트 데이터 조회 실패: ${err.message}`);
        return res.status(500).json({ success: false, message: "대시보드 차트 데이터 조회 실패" });
      }

      const latest = currentResults && currentResults.length > 0 ? currentResults[0] : {};
      const logs = chartResults && Array.isArray(chartResults) ? chartResults : [];

      const chartData = [...logs].reverse().map((row) => ({
        time: row.CREATE_AT,
        co2: Number(row.CO2 || 0),
        noise: Number(row.NOS || 0),
        temperature: Number(row.TEMP || 0),
        humidity: Number(row.HUM || 0),
        dustPm10: Number(row.DUST_PM10 || 0),
        dustPm25: Number(row.DUST_PM25 || 0)
      }));

      res.json({
        success: true,
        data: {
          current: {
            score: Number(latest.SPACE_SCORE || 0),
            statusText: latest.CST || "보통",
            statusLevel: latest.STATUS_LEVEL || "쾌적",
            co2: Number(latest.CO2 || 0),
            noise: Number(latest.NOS || 0),
            temperature: Number(latest.TEMP || 0),
            humidity: Number(latest.HUM || 0),
            dustPm10: Number(latest.DUST_PM10 || 0),
            dustPm25: Number(latest.DUST_PM25 || 0),
            createdAt: latest.CREATE_AT || null
          },
          charts: chartData
        }
      });
    });
  });
});

// ================== 통계 페이지 API ==================
app.get("/analytics", (req, res) => {
  saveLog("/analytics API 호출");

  const range = req.query.range || "6h";
  const location = req.query.location || "기본"; 

  const rangeMap = { "1h": 1, "6h": 6, "12h": 12, "24h": 24 };
  const hours = rangeMap[range] || 6;

  const sql = `
    SELECT
      id, DUST_PM10, DUST_PM25, TEMP, HUM, NOS, DST, CREATE_AT, location, CO2, SPACE_SCORE, ANALYSIS_TEXT, ALERT_TYPE
    FROM ${LOG_TABLE}
    WHERE location = ?
      AND CREATE_AT >= DATE_SUB((SELECT MAX(CREATE_AT) FROM ${LOG_TABLE} WHERE location = ?), INTERVAL ? HOUR)
    ORDER BY CREATE_AT ASC
  `;

  getPool().query(sql, [location, location, hours], (err, results) => {
    if (err) {
      console.error("통계 데이터 조회 실패:", err);
      saveLog(`통계 데이터 조회 실패: ${err.message}`);
      return res.status(500).json({ success: false, message: "통계 데이터 조회 실패" });
    }

    if (!results || results.length === 0) {
      return res.json({
        success: true, // 수정: 에러가 아니라 데이터가 빈 것 뿐이므로 success 처리
        data: { range, count: 0, chart: [], insights: [], summary: null }
      });
    }

    const avg = (key) => {
      const sum = results.reduce((acc, row) => acc + Number(row[key] || 0), 0);
      return Number((sum / results.length).toFixed(1));
    };

    const maxRow = (key) => {
      return results.reduce((max, row) => {
        return Number(row[key] || 0) > Number(max[key] || 0) ? row : max;
      }, results[0]);
    };

    const goodScoreRows = results.filter(row => Number(row.SPACE_SCORE || 0) >= 80);
    const goodRatio = Math.round((goodScoreRows.length / results.length) * 100);

    const bestScoreRow = maxRow("SPACE_SCORE");
    const maxCo2Row = maxRow("CO2");

    const chart = results.map(row => ({
      time: row.CREATE_AT,
      co2: Number(row.CO2 || 0),
      temperature: Number(row.TEMP || 0),
      humidity: Number(row.HUM || 0),
      noise: Number(row.NOS || 0),
      dustPm10: Number(row.DUST_PM10 || 0),
      dustPm25: Number(row.DUST_PM25 || 0),
      spaceScore: Number(row.SPACE_SCORE || 0),
      dustStatus: row.DST || null,
      location: row.location || null
    }));

    const insights = [
      {
        type: "best_focus_time", title: "최근 집중 시간대", time: bestScoreRow.CREATE_AT,
        message: `학습 지수 ${Number(bestScoreRow.SPACE_SCORE || 0)}점으로 가장 높은 집중도를 보인 시간입니다.`
      },
      {
        type: "co2_warning", title: "최근 CO₂ 발생 시점", time: maxCo2Row.CREATE_AT,
        message: `CO₂ ${Number(maxCo2Row.CO2 || 0)}ppm으로 환기가 필요할 수 있습니다.`
      },
      {
        type: "good_ratio", title: "쾌적 환경 비율", value: `${goodRatio}%`,
        message: `선택 기간 중 ${goodRatio}%의 시간이 쾌적한 환경이었습니다.`
      },
      {
        type: "average_score", title: "평균 학습 지수", value: `${avg("SPACE_SCORE")}점`,
        message: `선택 기간 평균 학습 지수입니다.`
      }
    ];

    const summary = {
      co2: { avg: avg("CO2"), unit: "ppm" },
      temperature: { avg: avg("TEMP"), unit: "°C" },
      humidity: { avg: avg("HUM"), unit: "%" },
      noise: { avg: avg("NOS"), unit: "dB" },
      dustPm10: { avg: avg("DUST_PM10"), unit: "㎍/m³" },
      dustPm25: { avg: avg("DUST_PM25"), unit: "㎍/m³" },
      spaceScore: { avg: avg("SPACE_SCORE"), unit: "점" }
    };

    res.json({
      success: true,
      data: { range, count: results.length, firstTime: results[0].CREATE_AT, lastTime: results[results.length - 1].CREATE_AT, chart, insights, summary }
    });
  });
});

// ================== 설정 전체 조회 API ==================
app.get("/settings", (req, res) => {
  const { userName } = req.query; 
  const settingsSql = `SELECT * FROM app_settings WHERE USER_NAME = ?`;
  const statusSql = `SELECT SPACE_SCORE FROM home_status ORDER BY CREATE_AT DESC LIMIT 1`;

  getPool().query(settingsSql, [userName], (err, settingsResults) => {
    if (err || settingsResults.length === 0) {
      return res.status(500).json({ success: false, message: "설정 조회 실패 또는 존재하지 않는 유저" });
    }

    getPool().query(statusSql, (statusErr, statusResults) => {
      const settingsData = settingsResults[0];
      const spaceScore = (statusResults && statusResults.length > 0) ? Number(statusResults[0].SPACE_SCORE) : 0;

      res.json({
        success: true,
        data: {
          currentStatus: { spaceScore: spaceScore },
          menus: [
            { key: "alerts", name: "알림 설정", endpoint: "/settings/alerts" },
            { key: "devices", name: "기기 관리", endpoint: "/settings/devices" },
            { key: "profile", name: "프로필 수정", endpoint: "/settings/profile" }
          ],
          alerts: {
            emailAlertEnabled: Boolean(settingsData.EMAIL_ALERT),
            pushAlertEnabled: Boolean(settingsData.PUSH_ALERT),
            dailyReportEnabled: Boolean(settingsData.DAILY_REPORT),
            weeklyReportEnabled: Boolean(settingsData.WEEKLY_REPORT),
            co2Threshold: Number(settingsData.CO2_THRESHOLD || 0),
            noiseThreshold: Number(settingsData.NOS_THRESHOLD || settingsData.alert_noise_threshold || 0),
            temperatureThreshold: Number(settingsData.TEMP_THRESHOLD || 0),
            dustThreshold: Number(settingsData.DUST_THRESHOLD || settingsData.alert_dust_threshold || 0)
          },
          devices: {
            deviceName: settingsData.DEVICE_NAME || null,
            deviceStatus: settingsData.DEVICE_STATUS || null,
            lastConnected: settingsData.LAST_CONNECTED || null
          },
          profile: {
            userName: settingsData.USER_NAME || null,
            userEmail: settingsData.USER_EMAIL || null,
            userSpace: settingsData.USER_SPACE || null
          },
          themeMode: settingsData.theme_mode || "Light",
          serviceInfo: settingsData.service_info || "Clean-Sync",
          updatedAt: settingsData.updated_at
        }
      });
    });
  });
});

// ================== 알림 설정 조회 API ==================
app.get("/settings/alerts", (req, res) => {
  const { userName } = req.query;
  const sql = `SELECT * FROM app_settings WHERE USER_NAME = ?`;

  getPool().query(sql, [userName], (err, results) => {
    if (err) {
      console.error("알림 설정 조회 실패:", err);
      return res.status(500).json({ success: false, message: "알림 설정 조회 실패" });
    }
    if (!results || results.length === 0) {
      return res.json({ success: false, message: "알림 설정 데이터가 없습니다." });
    }
    const data = results[0];
    res.json({
      success: true,
      data: {
        emailAlertEnabled: Boolean(data.EMAIL_ALERT),
        pushAlertEnabled: Boolean(data.PUSH_ALERT),
        dailyReportEnabled: Boolean(data.DAILY_REPORT),
        weeklyReportEnabled: Boolean(data.WEEKLY_REPORT),
        co2Threshold: Number(data.CO2_THRESHOLD || 0),
        noiseThreshold: Number(data.NOS_THRESHOLD || data.alert_noise_threshold || 0),
        temperatureThreshold: Number(data.TEMP_THRESHOLD || 0),
        dustThreshold: Number(data.DUST_THRESHOLD || data.alert_dust_threshold || 0),
        dustAlertEnabled: Boolean(data.dust_alert_enabled),
        noiseAlertEnabled: Boolean(data.noise_alert_enabled),
        themeMode: data.theme_mode || "Light",
        serviceInfo: data.service_info || "Clean-Sync",
        updatedAt: data.updated_at
      }
    });
  });
});

// ================== 알림 설정 저장 API ==================
app.put("/settings/alerts", (req, res) => {
  const { userName, emailAlertEnabled, pushAlertEnabled, dailyReportEnabled, weeklyReportEnabled, co2Threshold, noiseThreshold, temperatureThreshold, dustThreshold, dustAlertEnabled, noiseAlertEnabled, themeMode } = req.body;

  const sql = `
    UPDATE app_settings
    SET EMAIL_ALERT=?, PUSH_ALERT=?, DAILY_REPORT=?, WEEKLY_REPORT=?, CO2_THRESHOLD=?, NOS_THRESHOLD=?, TEMP_THRESHOLD=?, DUST_THRESHOLD=?, alert_dust_threshold=?, alert_noise_threshold=?, dust_alert_enabled=?, noise_alert_enabled=?, theme_mode=?
    WHERE USER_NAME = ?
  `;
  const values = [
    emailAlertEnabled ? 1 : 0, pushAlertEnabled ? 1 : 0, dailyReportEnabled ? 1 : 0, weeklyReportEnabled ? 1 : 0,
    Number(co2Threshold), Number(noiseThreshold), Number(temperatureThreshold), Number(dustThreshold), Number(dustThreshold), Number(noiseThreshold),
    dustAlertEnabled === undefined ? 1 : dustAlertEnabled ? 1 : 0, noiseAlertEnabled === undefined ? 1 : noiseAlertEnabled ? 1 : 0, themeMode || "Light", userName
  ];

  getPool().query(sql, values, (err) => {
    if (err) return res.status(500).json({ success: false, message: "알림 설정 저장 실패" });
    res.json({ success: true, message: "알림 설정이 저장되었습니다." });
  });
});

// ================== 웹 푸시 구독 정보 저장 API ==================
app.post("/settings/subscription", (req, res) => {
  const { userName, subscription } = req.body;
  if (!userName || !subscription) return res.status(400).json({ success: false, message: "필수 정보 누락" });

  getPool().query(`UPDATE app_settings SET PUSH_SUBSCRIPTION = ? WHERE USER_NAME = ?`, [JSON.stringify(subscription), userName], (err) => {
    if (err) return res.status(500).json({ success: false, message: "푸시 구독 저장 실패" });
    res.json({ success: true, message: "푸시 구독 정보가 저장되었습니다." });
  });
});

// ================== 기기 관리 조회 API ==================
app.get("/settings/devices", (req, res) => {
  const { userName } = req.query;
  getPool().query(`SELECT DEVICE_NAME, DEVICE_STATUS, LAST_CONNECTED FROM app_settings WHERE USER_NAME = ?`, [userName], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "기기 관리 조회 실패" });
    if (!results || results.length === 0) return res.json({ success: false, message: "기기 데이터가 없습니다." });
    res.json({ success: true, data: { deviceName: results[0].DEVICE_NAME || null, deviceStatus: results[0].DEVICE_STATUS || null, lastConnected: results[0].LAST_CONNECTED || null } });
  });
});

// ================== 기기 관리 삭제 API ==================
app.delete("/settings/devices", (req, res) => {
  const { userName } = req.body;
  if (!userName) return res.status(400).json({ success: false, message: "userName이 누락되었습니다." });

  const sql = `UPDATE app_settings SET DEVICE_NAME = NULL, DEVICE_STATUS = '연결안됨', LAST_CONNECTED = NULL WHERE USER_NAME = ?`;
  getPool().query(sql, [userName], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "기기 삭제 실패" });
    if (result.affectedRows === 0) return res.json({ success: false, message: "유저 정보를 찾을 수 없습니다." });
    res.json({ success: true, message: "기기가 삭제되었습니다." });
  });
});

// ================== 프로필 조회 API ==================
app.get("/settings/profile", (req, res) => {
  const { userName } = req.query;
  let sql = `SELECT USER_NAME, USER_EMAIL, USER_SPACE FROM app_settings`;
  let params = [];
  if (userName) { sql += ` WHERE USER_NAME = ?`; params = [userName]; } else { sql += ` LIMIT 1`; }

  getPool().query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "프로필 조회 실패" });
    if (!results || results.length === 0) return res.json({ success: false, message: "프로필 데이터가 없습니다." });
    res.json({ success: true, data: { userName: results[0].USER_NAME || null, userEmail: results[0].USER_EMAIL || null, userSpace: results[0].USER_SPACE || null } });
  });
});

// ================== 프로필 생성 API ==================
app.post("/settings/profile", (req, res) => {
  const { userName, userEmail, userSpace } = req.body;
  if (!userName) return res.status(400).json({ success: false, message: "아이디 필수" });

  getPool().query(`INSERT IGNORE INTO app_settings (USER_NAME, USER_EMAIL, USER_SPACE) VALUES (?, ?, ?)`, [userName, userEmail, userSpace], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "프로필 생성 실패" });
    if (result.affectedRows === 0) return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
    res.json({ success: true, message: "프로필이 생성되었습니다." });
  });
});

// ================== 프로필 저장 API ==================
app.put("/settings/profile", (req, res) => {
  const { userName, userEmail, userSpace } = req.body;

  getPool().query(`UPDATE app_settings SET USER_EMAIL = ?, USER_SPACE = ? WHERE USER_NAME = ?`, [userEmail, userSpace, userName], (err) => {
    if (err) return res.status(500).json({ success: false, message: "프로필 저장 실패" });

    getPool().query(`SELECT location FROM home_status WHERE location = ? ORDER BY CREATE_AT DESC LIMIT 1`, [userSpace], (deviceErr, deviceResults) => {
      const isExists = (!deviceErr && deviceResults && deviceResults.length > 0);
      const deviceName = isExists ? userSpace : null;
      const deviceStatus = isExists ? '연결됨' : '연결안됨';
      const lastConnected = isExists ? new Date() : null;

      getPool().query(`UPDATE app_settings SET DEVICE_NAME = ?, DEVICE_STATUS = ?, LAST_CONNECTED = ? WHERE USER_NAME = ?`, [deviceName, deviceStatus, lastConnected, userName], (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: "기기 상태 자동 동기화 실패" });
        res.json({ success: true, message: "프로필 저장 및 기기 상태 동기화 완료." });
      });
    });
  });
});

// ================== 서버 실행 ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API 서버 실행 중: http://0.0.0.0:${PORT}`);
  saveLog("서버 실행");
});