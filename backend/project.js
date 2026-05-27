const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// 1. 메인 홈 데이터 API
app.get("/home", (req, res) => {
  const sql = `SELECT * FROM home_status ORDER BY CREATE_AT DESC LIMIT 1`;
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("홈 DB 오류:", err);
      return res.status(500).json({ success: false, message: "DB 오류 발생" });
    }
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ success: false, message: "데이터 없음" });
    }

    const data = results[0];
    res.json({
      success: true,
      data: {
        score: Number(data.SPACE_SCORE || 0),
        statusText: data.CST || "알 수 없음",
        aiMessage: data.AI_MESSAGE || "데이터 없음",
        co2: Number(data.CO2 || 0),
        noise: Number(data.NOS || 0),
        temperature: Number(data.TEMP || 0),
        humidity: Number(data.HUM || 0),
        dustPm10: Number(data.DUST_PM10 || 0),
        dustPm25: Number(data.DUST_PM25 || 0)
      }
    });
  });
});

// 2. 대시보드 API (home_status의 CST + statistics_logs의 차트 데이터 통합)
app.get("/dashboard", (req, res) => {
  const currentSql = `SELECT * FROM home_status ORDER BY CREATE_AT DESC LIMIT 1`;
  
  pool.query(currentSql, (err, currentResults) => {
    if (err) {
      console.error("대시보드 실시간 데이터 조회 실패:", err);
      return res.status(500).json({ success: false, message: "조회 실패" });
    }
    
    const chartSql = `SELECT * FROM statistics_logs ORDER BY CREATE_AT DESC LIMIT 20`;
    
    pool.query(chartSql, (err, chartResults) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API 서버 실행 중: http://0.0.0.0:${PORT}`);
});