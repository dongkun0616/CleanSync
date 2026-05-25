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
  res.send("서버 정상 작동 중입니다. /home 또는 /dashboard 로 접속하세요.");
});

// ================== 메인 홈 화면 API ==================
/*
  메인 홈 화면에 필요한 최신 데이터 1개를 조회해서 전달
  - 학습 지수
  - 현재 상태
  - AI 메시지
  - 센서 값
*/
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
      saveLog("홈 데이터 없음");

      return res.json({
        success: false,
        message: "데이터가 없습니다."
      });
    }

    const data = results[0];

    /*
      DECIMAL 타입은 문자열로 넘어올 수 있어서
      프론트 그래프/게이지에서 쓰기 쉽게 Number()로 변환
    */
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
/*
  대시보드 화면용 API

  current:
  - 현재 카드에 표시할 최신 센서 값

  charts:
  - 그래프를 그리기 위한 최근 데이터 배열
  - DB에서는 최신순으로 가져오고, 프론트 그래프용으로 과거 → 현재 순서로 변경
*/
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
      saveLog("대시보드 데이터 없음");

      return res.json({
        success: false,
        message: "데이터가 없습니다."
      });
    }

    // DESC 정렬이므로 results[0]이 가장 최신 데이터
    const latest = results[0];

    /*
      [...results]로 배열 복사 후 reverse()
      원본 results를 직접 뒤집지 않기 위해 사용
    */
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

// ================== 서버 실행 ==================
app.listen(3000, "0.0.0.0", () => {
  console.log("API 서버 실행: http://13.124.252.181:3000");
  saveLog("서버 실행");
});
