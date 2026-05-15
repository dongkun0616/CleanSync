import os
import pymysql
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta

# ================== 설정 로드 ==================
load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_TOPIC = "myroom/sensor/data"

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "db": os.getenv("DB_NAME"),
    "charset": "utf8mb4"
}

# ================== 상태 계산 함수 ==================

# 미세먼지 상태 계산
def calc_dust_status(pm25):
    if pm25 > 35:
        return "나쁨"
    elif pm25 > 15:
        return "보통"
    else:
        return "좋음"

# 소음 기준 혼잡도 상태 계산
def calc_congestion(noise):
    if noise < 40:
        return "여유"
    elif noise < 70:
        return "보통"
    else:
        return "혼잡"

# 혼잡도 점수 계산
def calc_congestion_score(noise):
    if noise < 40:
        return 30
    elif noise < 70:
        return 60
    else:
        return 90

# 공간 점수 계산
def calc_space_score(co2, noise, temp):
    score = 100

    # CO2 감점
    if co2 > 1000:
        co2_penalty = ((co2 - 1000) / 100) * 5
        if co2_penalty > 30:
            co2_penalty = 30
        score -= co2_penalty

    # 소음 감점
    if noise > 70:
        noise_penalty = ((noise - 70) / 5) * 5
        if noise_penalty > 25:
            noise_penalty = 25
        score -= noise_penalty

    # 온도 감점
    if temp < 22:
        temp_penalty = (22 - temp) * 3
        if temp_penalty > 15:
            temp_penalty = 15
        score -= temp_penalty

    elif temp > 24:
        temp_penalty = (temp - 24) * 3
        if temp_penalty > 15:
            temp_penalty = 15
        score -= temp_penalty

    # 최소 점수 제한
    if score < 0:
        score = 0

    return round(score)

# 학습 상태 계산
def calc_study_status(score):
    if score >= 90:
        return "매우 좋음"
    elif score >= 75:
        return "좋음"
    elif score >= 60:
        return "보통"
    elif score >= 40:
        return "나쁨"
    else:
        return "매우 나쁨"

# ================== MQTT 연결 ==================
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ MQTT 브로커 연결 성공!")
        client.subscribe(MQTT_TOPIC)
        print(f"📡 구독 토픽: {MQTT_TOPIC}")
    else:
        print(f"❌ 연결 실패 (코드: {reason_code})")

# ================== MQTT 메시지 수신 ==================
def on_message(client, userdata, msg):
    conn = None

    try:
        payload = msg.payload.decode()
        print(f"📥 수신 데이터: {payload}")

        data = json.loads(payload)

        required_keys = ["temp", "humi", "pm25", "pm10", "sound", "co2"]

        for key in required_keys:
            if key not in data:
                print(f"❌ 누락된 데이터: {key}")
                return

        # 센서 데이터 변환
        temp = float(data["temp"])
        hum = float(data["humi"])
        pm25 = float(data["pm25"])
        pm10 = float(data["pm10"])
        noise = float(data["sound"])
        co2 = float(data["co2"])

        # 현재 시간 (KST)
        kst_now = datetime.utcnow() + timedelta(hours=9)
        formatted_time = kst_now.strftime("%Y-%m-%d %H:%M:%S")

        # 상태 계산
        dst_status = calc_dust_status(pm25)
        cst = calc_congestion(noise)
        cs = calc_congestion_score(noise)

        space_score = calc_space_score(co2, noise, temp)
        study_status = calc_study_status(space_score)

        # DB 연결
        conn = pymysql.connect(**DB_CONFIG)

        with conn.cursor() as cursor:

            sql = """
                INSERT INTO home_status
                (
                    CREATE_AT,
                    DST,
                    CST,
                    CS,
                    WIFI_COUNT,
                    location,
                    CO2,
                    SPACE_SCORE
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            values = (
                formatted_time,   # CREATE_AT
                dst_status,       # DST
                cst,              # CST
                cs,               # CS
                0,                # WIFI_COUNT
                "동아리방",        # location
                co2,              # CO2
                space_score       # SPACE_SCORE
            )

            cursor.execute(sql, values)

        conn.commit()

        print(
            f"✔️ 저장 완료 | "
            f"시간={formatted_time}, "
            f"DST={dst_status}, "
            f"CST={cst}, "
            f"CS={cs}, "
            f"CO2={co2}, "
            f"SPACE_SCORE={space_score}, "
            f"학습상태={study_status}"
        )

    except Exception as e:
        print(f"❌ 에러 발생: {e}")

    finally:
        if conn:
            conn.close()

# ================== MQTT 클라이언트 설정 ==================
client = mqtt.Client(CallbackAPIVersion.VERSION2)

client.on_connect = on_connect
client.on_message = on_message

print("🚀 AWS 수집 서버 가동 중...")

if not DB_CONFIG["host"]:
    print("❌ 에러: .env 파일에서 DB 정보를 읽어올 수 없습니다!")
else:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()