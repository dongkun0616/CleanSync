const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());

// ================== 로그 시스템 ==================
function saveLog(message) {
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync("log.txt", log);
}

// ================== DB 연결 ==================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패:", err);
    saveLog(`DB 연결 실패: ${err.message}`);
  } else {
    console.log("DB 연결 성공");
    saveLog("DB 연결 성공");
  }
});

// ================== 기본 API ==================
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다. /home, /dashboard, /analytics, /settings 로 접속하세요.");
});

// ================== 메인 홈 화면 API ==================
app.get("/home", (req, res) => {
  saveLog("/home API 호출");

  const sql = `
    SELECT
      SPACE_SCORE,
      CST,
      STATUS_LEVEL,
      AI_MESSAGE,
      CO2,
      NOS,
      TEMP,
      HUM,
      DUST_PM10,
      DUST_PM25,
      WIFI_COUNT,
      location,
      CREATE_AT
    FROM home_status
    ORDER BY CREATE_AT DESC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("홈 데이터 조회 실패:", err);
      saveLog(`홈 데이터 조회 실패: ${err.message}`);

      return res.status(500).json({
        success: false,
        message: "홈 데이터 조회 실패"
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: "데이터가 없습니다."
      });
    }

    const data = results[0];

    res.json({
      success: true,
      data: {
        score: Number(data.SPACE_SCORE),
        statusText: data.CST,
        statusLevel: data.STATUS_LEVEL,
        aiMessage: data.AI_MESSAGE,
        co2: Number(data.CO2),
        noise: Number(data.NOS),
        temperature: Number(data.TEMP),
        humidity: Number(data.HUM),
        dustPm10: Number(data.DUST_PM10),
        dustPm25: Number(data.DUST_PM25),
        wifiCount: Number(data.WIFI_COUNT),
        location: data.location,
        createdAt: data.CREATE_AT
      }
    });

    saveLog("메인 홈 데이터 조회 성공");
  });
});

// ================== 실시간 대시보드 API ==================
app.get("/dashboard", (req, res) => {
  saveLog("/dashboard API 호출");

  const sql = `
    SELECT
      id,
      CO2,
      NOS,
      TEMP,
      HUM,
      DUST_PM10,
      DUST_PM25,
      CREATE_AT
    FROM home_status
    ORDER BY CREATE_AT DESC
    LIMIT 20
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("대시보드 조회 실패:", err);
      saveLog(`대시보드 조회 실패: ${err.message}`);

      return res.status(500).json({
        success: false,
        message: "대시보드 데이터 조회 실패"
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: "데이터가 없습니다."
      });
    }

    const latest = results[0];

    const chartData = [...results].reverse().map((row) => {
      return {
        time: row.CREATE_AT,
        co2: Number(row.CO2),
        noise: Number(row.NOS),
        temperature: Number(row.TEMP),
        humidity: Number(row.HUM),
        dustPm10: Number(row.DUST_PM10),
        dustPm25: Number(row.DUST_PM25)
      };
    });

    res.json({
      success: true,
      data: {
        current: {
          co2: Number(latest.CO2),
          noise: Number(latest.NOS),
          temperature: Number(latest.TEMP),
          humidity: Number(latest.HUM),
          dustPm10: Number(latest.DUST_PM10),
          dustPm25: Number(latest.DUST_PM25),
          createdAt: latest.CREATE_AT
        },
        charts: chartData
      }
    });

    saveLog("대시보드 데이터 조회 성공");
  });
});

// ================== 통계 페이지 API ==================
app.get("/analytics", (req, res) => {
  saveLog("/analytics API 호출");

  const range = req.query.range || "6h";

  const rangeMap = {
    "1h": 1,
    "6h": 6,
    "12h": 12,
    "24h": 24
  };

  const hours = rangeMap[range] || 6;

  const sql = `
  SELECT
    SPACE_SCORE,
    CO2,
    NOS,
    TEMP,
    HUM,
    DUST_PM10,
    DUST_PM25,
    CREATE_AT
  FROM home_status
  WHERE CREATE_AT >= DATE_SUB(NOW(), INTERVAL ? HOUR)
  ORDER BY CREATE_AT ASC
`;
  db.query(sql, [hours], (err, results) => {
    if (err) {
      console.error("통계 데이터 조회 실패:", err);
      saveLog(`통계 데이터 조회 실패: ${err.message}`);

      return res.status(500).json({
        success: false,
        message: "통계 데이터 조회 실패"
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: "해당 기간의 데이터가 없습니다."
      });
    }

    const chartData = results.map((row) => {
      return {
        time: row.CREATE_AT,
        score: Number(row.SPACE_SCORE),
        co2: Number(row.CO2),
        noise: Number(row.NOS),
        temperature: Number(row.TEMP),
        humidity: Number(row.HUM),
        dustPm10: Number(row.DUST_PM10),
        dustPm25: Number(row.DUST_PM25)
      };
    });

    const avg = (key) => {
      const sum = chartData.reduce((total, item) => total + item[key], 0);
      return Number((sum / chartData.length).toFixed(1));
    };

    const avgScore = avg("score");
    const avgCo2 = avg("co2");
    const avgNoise = avg("noise");
    const avgTemperature = avg("temperature");
    const avgHumidity = avg("humidity");
    const avgDustPm10 = avg("dustPm10");
    const avgDustPm25 = avg("dustPm25");

    const bestFocus = chartData.reduce((best, item) => {
      return item.score > best.score ? item : best;
    }, chartData[0]);

    const highestCo2 = chartData.reduce((max, item) => {
      return item.co2 > max.co2 ? item : max;
    }, chartData[0]);

    const comfortableCount = chartData.filter((item) => item.score >= 80).length;
    const comfortableRate = Number(((comfortableCount / chartData.length) * 100).toFixed(1));

    res.json({
      success: true,
      range: range,
      data: {
        chart: chartData,

        summary: {
          avgScore,
          avgCo2,
          avgNoise,
          avgTemperature,
          avgHumidity,
          avgDustPm10,
          avgDustPm25,
          totalCount: chartData.length
        },

        insights: {
          bestFocusTime: bestFocus.time,
          bestFocusScore: bestFocus.score,

          highestCo2Time: highestCo2.time,
          highestCo2Value: highestCo2.co2,

          comfortableRate,

          message: `선택 기간 동안 평균 학습 지수는 ${avgScore}점이고, 쾌적 비율은 ${comfortableRate}%입니다.`
        }
      }
    });

    saveLog("통계 데이터 조회 성공");
  });
});

// ================== 설정 조회 API ==================
app.get("/settings", (req, res) => {
  saveLog("/settings API 호출");

  const sql = `
    SELECT
      dust_alert_enabled,
      noise_alert_enabled,
      alert_dust_threshold,
      alert_noise_threshold,
      theme_mode,
      service_info
    FROM app_settings
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("설정 조회 실패:", err);
      saveLog(`설정 조회 실패: ${err.message}`);

      return res.status(500).json({
        success: false,
        message: "설정 조회 실패"
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: "설정 데이터가 없습니다."
      });
    }

    const data = results[0];

    res.json({
      success: true,
      data: {
        dustAlertEnabled: Boolean(data.dust_alert_enabled),
        noiseAlertEnabled: Boolean(data.noise_alert_enabled),
        dustThreshold: Number(data.alert_dust_threshold),
        noiseThreshold: Number(data.alert_noise_threshold),
        themeMode: data.theme_mode,
        serviceInfo: data.service_info
      }
    });

    saveLog("설정 조회 성공");
  });
});

// ================== 설정 저장 API ==================
app.put("/settings", (req, res) => {
  saveLog("/settings 저장 API 호출");

  const {
    dustAlertEnabled,
    noiseAlertEnabled,
    dustThreshold,
    noiseThreshold,
    themeMode
  } = req.body;

  const sql = `
    UPDATE app_settings
    SET
      dust_alert_enabled = ?,
      noise_alert_enabled = ?,
      alert_dust_threshold = ?,
      alert_noise_threshold = ?,
      theme_mode = ?
    LIMIT 1
  `;

  const values = [
    dustAlertEnabled ? 1 : 0,
    noiseAlertEnabled ? 1 : 0,
    Number(dustThreshold),
    Number(noiseThreshold),
    themeMode
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("설정 저장 실패:", err);
      saveLog(`설정 저장 실패: ${err.message}`);

      return res.status(500).json({
        success: false,
        message: "설정 저장 실패"
      });
    }

    res.json({
      success: true,
      message: "설정이 저장되었습니다."
    });

    saveLog("설정 저장 성공");
  });
});

// ================== 서버 실행 ==================
app.listen(3000, "0.0.0.0", () => {
  console.log("API 서버 실행: http://13.124.252.181:3000");
  saveLog("서버 실행");
});
