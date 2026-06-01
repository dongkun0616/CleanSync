const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config({ path: "/home/ec2-user/clean-sync/backend/.env" });

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT"] }));
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

app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다. /home, /dashboard, /analytics, /settings 로 접속하세요.");
});

// ================== 메인 홈 API ==================
app.get("/home", (req, res) => {
  const sql = `SELECT * FROM home_status ORDER BY CREATE_AT DESC LIMIT 1`;

  getPool().query(sql, (err, results) => {
    if (err) {
      console.error("홈 DB 오류:", err);
      return res.status(500).json({ success: false, message: "DB 오류 발생" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "데이터 없음" });
    }

    const data = results[0];

    res.json({
      success: true,
      data: {
        score: Number(data.SPACE_SCORE || 0),
        statusText: data.CST || "알 수 없음",
        statusLevel: data.STATUS_LEVEL || null,
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

// ================== 대시보드 API ==================
app.get("/dashboard", (req, res) => {
  const currentSql = `SELECT * FROM home_status ORDER BY CREATE_AT DESC LIMIT 1`;

  getPool().query(currentSql, (err, currentResults) => {
    if (err) {
      console.error("대시보드 실시간 데이터 조회 실패:", err);
      return res.status(500).json({ success: false, message: "조회 실패" });
    }

    const chartSql = `SELECT * FROM statistics_logs ORDER BY CREATE_AT DESC LIMIT 20`;

    getPool().query(chartSql, (err, chartResults) => {
      if (err) {
        console.error("대시보드 차트 데이터 조회 실패:", err);
        return res.status(500).json({ success: false, message: "조회 실패" });
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
            co2: Number(latest.CO2 || 0),
            noise: Number(latest.NOS || 0),
            temperature: Number(latest.TEMP || 0),
            humidity: Number(latest.HUM || 0),
            dustPm10: Number(latest.DUST_PM10 || 0),
            dustPm25: Number(latest.DUST_PM25 || 0)
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

  getPool().query(sql, [hours], (err, results) => {
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

    const chartData = results.map((row) => ({
      time: row.CREATE_AT,
      score: Number(row.SPACE_SCORE || 0),
      co2: Number(row.CO2 || 0),
      noise: Number(row.NOS || 0),
      temperature: Number(row.TEMP || 0),
      humidity: Number(row.HUM || 0),
      dustPm10: Number(row.DUST_PM10 || 0),
      dustPm25: Number(row.DUST_PM25 || 0)
    }));

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
      range,
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

  getPool().query(sql, (err, results) => {
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
        dustThreshold: Number(data.alert_dust_threshold || 0),
        noiseThreshold: Number(data.alert_noise_threshold || 0),
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

  getPool().query(sql, values, (err) => {
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API 서버 실행 중: http://0.0.0.0:${PORT}`);
});