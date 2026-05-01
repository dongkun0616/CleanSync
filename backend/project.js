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
    saveLog("DB 연결 실패");
  } else {
    console.log("DB 연결 성공");
    saveLog("DB 연결 성공");
  }
});

// ================== API ==================

app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다. /test 또는 /home으로 접속하세요.");
});

// 테스트 API
app.get("/test", (req, res) => {
  saveLog("/test API 호출");
  res.json({ message: "API 정상 작동" });
});

// 홈 데이터 조회 API
app.get("/home", (req, res) => {
  saveLog("/home API 호출 시작");

  const sql = `
    SELECT *
    FROM home_status
    ORDER BY CREATE_AT DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB 조회 실패:", err);
      saveLog(`DB 조회 실패: ${err.message}`);
      return res.status(500).json({ error: "DB 조회 실패" });
    }

    saveLog(`DB 조회 성공 (데이터 개수: ${results.length})`);
    res.json(results);
  });
});

// ================== 서버 실행 ==================
app.listen(3000, "0.0.0.0", () => {
  console.log("API 서버 실행: http://13.124.252.181:3000");
  saveLog("서버 실행");
});