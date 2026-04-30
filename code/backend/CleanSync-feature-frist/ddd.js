const express = require("express");
const app = express();

app.use(express.json());

// 1. 최신 환경 데이터 조회
app.get("/env/check", (req, res) => {
    res.json({
    "dust" : 25, 
    "noise" : 100, 
    "temp" : 25, 
    "humi" : 40, 
    "status" : "good"
    });
});

// 2. 혼잡도 정보 조회
app.get("/crowd/check", (req, res) => {

    res.json({
        "crowd" : "quiet",
         "score" : 85
    })
    });


// 3. 과거 이력 데이터 조회
app.get("/history/check", (req, res) => {
    const period = req.query.period 
    res.json([
         { "time" : "10:00", "dust" : 40}, 
         {"time" : "11:00", "dust" : 30}
        ])
    });
    
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});