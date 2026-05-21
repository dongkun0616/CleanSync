const express = require("express");
const mysql = require("mysql2");
const cors = require('cors');
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
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
  res.json({ message: "서버 정상 작동" });
});

// 홈 데이터 조회 API
app.get("/home", (req, res) => {
  saveLog("/home API 호출 시작");

  // 변경된 SQL: id 기준 내림차순 정렬 후, 가장 위 데이터 1개만 모든 컬럼(*) 선택
  const sql = `
    SELECT * 
    FROM home_status 
    ORDER BY id DESC 
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB 조회 실패:", err);
      saveLog(`DB 조회 실패: ${err.message}`);
      return res.status(500).json({ error: "DB 조회 실패" });
    }

    // 데이터가 없을 경우를 대비해 빈 배열 체크
    if (results.length === 0) {
      saveLog("DB 조회 성공: 데이터가 없음");
      return res.json([]);
    }

    saveLog(`DB 조회 성공 (최신 데이터 ID: ${results[0].id})`);
    
    // 결과가 배열로 나오므로 그대로 보냅니다. 
    // 프론트엔드에서는 data[0].TEMP 등으로 접근하게 됩니다.
    res.json(results);
  });
});

// ================== 서버 실행 ==================
app.listen(3000, "0.0.0.0", () => {
  console.log("API 서버 실행: http://13.124.252.181:3000");
  saveLog("서버 실행");
});