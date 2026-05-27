import os
import pymysql
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta

# ================== .env 파일 불러오기 ==================
load_dotenv()

# ================== MQTT 설정 ==================
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_TOPIC = "myroom/sensor/data"

# ================== DB 연결 정보 ==================
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "db": os.getenv("DB_NAME"),
    "charset": "utf8mb4"
}

# =========================================================
# 미세먼지 상태 계산
# pm25 값 기준으로 좋음/보통/나쁨 판정
# =========================================================
def calc_dust_status(pm25):
    if pm25 > 35:
        return "나쁨"
    elif pm25 > 15:
        return "보통"
    else:
        return "좋음"

# =========================================================
# 소음 기준 혼잡도 상태 계산
# =========================================================
def calc_congestion(noise):
    if noise <= 10:
        return "여유"
    elif noise <= 40:
        return "보통"
    else:
        return "혼잡"

# =========================================================
# 혼잡도 점수 계산
# 숫자로 저장하기 위한 값
# =========================================================
def calc_congestion_score(noise):
    if noise < 10:
        return 30
    elif noise < 40:
        return 60
    else:
        return 90

# =========================================================
# 공간 점수 계산
# 센서 값이 안 좋을수록 점수가 감소
# =========================================================
def calc_space_score(co2, noise, temp, hum, pm25):

    # 초기 점수
    score = 100

    # ================== CO2 감점 ==================
    if co2 > 1000:
        score -= min(((co2 - 1000) / 100) * 5, 30)

    # ================== 소음 감점 ==================
    if noise > 70:
        score -= min(((noise - 70) / 5) * 5, 25)

    # ================== 온도 감점 ==================
    if temp < 22:
        score -= min((22 - temp) * 3, 15)

    elif temp > 24:
        score -= min((temp - 24) * 3, 15)

    # ================== 습도 감점 ==================
    if hum < 40:
        score -= min((40 - hum) * 1, 10)

    elif hum > 60:
        score -= min((hum - 60) * 1, 10)

    # ================== 미세먼지 감점 ==================
    if pm25 > 35:
        score -= 10

    # 점수가 0 이하로 내려가지 않도록 처리
    return max(0, round(score))

# =========================================================
# 공간 점수 기반 상태 등급 계산
# =========================================================
def calc_status_level(space_score):

    if space_score >= 90:
        return "매우 쾌적"

    elif space_score >= 75:
        return "쾌적"

    elif space_score >= 60:
        return "보통"

    elif space_score >= 40:
        return "나쁨"

    else:
        return "매우 나쁨"

# =========================================================
# AI 안내 메시지 생성
# 센서 상태에 따라 사용자에게 안내 문구 제공
# =========================================================
def calc_ai_message(temp, hum, pm25, pm10, noise, co2):

    messages = []

    # ================== 온도 메시지 ==================
    if temp >= 28:
        messages.append(
            "온도가 높습니다. 냉방을 켜거나 창문을 열어 온도를 낮추세요."
        )

    elif temp <= 18:
        messages.append(
            "온도가 낮습니다. 난방을 켜거나 실내 온도를 높이세요."
        )

    # ================== 습도 메시지 ==================
    if hum >= 70:
        messages.append(
            "습도가 높습니다. 제습이나 환기가 필요합니다."
        )

    elif hum <= 30:
        messages.append(
            "습도가 낮습니다. 가습기를 사용하거나 물을 가까이 두세요."
        )

    # ================== 미세먼지 메시지 ==================
    if pm25 > 35 or pm10 > 80:
        messages.append(
            "미세먼지 농도가 높습니다. 창문을 닫고 공기청정기를 사용하세요."
        )

    # ================== 소음 메시지 ==================
    if noise >= 70:
        messages.append(
            "소음이 큽니다. 조용한 환경을 만들거나 소음 원인을 줄이세요."
        )

    # ================== CO2 메시지 ==================
    if co2 >= 1000:
        messages.append(
            "이산화탄소 농도가 높습니다. 창문을 열어 환기하세요."
        )

    # 모든 상태가 정상일 경우
    if len(messages) == 0:
        return "현재 실내 환경이 쾌적합니다."

    # 메시지들을 하나의 문자열로 합침
    return " ".join(messages)

# =========================================================
# MQTT 연결 성공 시 실행
# =========================================================
def on_connect(client, userdata, flags, reason_code, properties):

    if reason_code == 0:

        print("✅ MQTT 브로커 연결 성공!")

        # MQTT 토픽 구독
        client.subscribe(MQTT_TOPIC)

        print(f"📡 구독 토픽: {MQTT_TOPIC}")

    else:
        print(f"❌ 연결 실패 (코드: {reason_code})")

# =========================================================
# MQTT 메시지 수신 시 실행
# =========================================================
def on_message(client, userdata, msg):

    conn = None

    try:

        # MQTT 메시지 문자열 변환
        payload = msg.payload.decode()

        print(f"📥 수신 데이터: {payload}")

        # JSON 형식 변환
        data = json.loads(payload)

        # =================================================
        # 필수 센서 데이터 존재 여부 확인
        # =================================================
        required_keys = [
            "temp",
            "humi",
            "pm25",
            "pm10",
            "sound",
            "co2"
        ]

        for key in required_keys:

            if key not in data:
                print(f"❌ 누락된 데이터: {key}")
                return

        # =================================================
        # 센서 데이터 저장
        # =================================================
        temp = float(data["temp"])
        hum = float(data["humi"])
        pm25 = float(data["pm25"])
        pm10 = float(data["pm10"])
        noise = float(data["sound"])
        co2 = float(data["co2"])

        # =================================================
        # 한국 시간 생성
        # =================================================
        kst_now = datetime.utcnow() + timedelta(hours=9)

        formatted_time = kst_now.strftime("%Y-%m-%d %H:%M:%S")

        # =================================================
        # 상태 계산
        # =================================================
        dst_status = calc_dust_status(pm25)

        cst = calc_congestion(noise)

        cs = calc_congestion_score(noise)

        space_score = calc_space_score(
            co2,
            noise,
            temp,
            hum,
            pm25
        )

        status_level = calc_status_level(space_score)

        ai_message = calc_ai_message(
            temp,
            hum,
            pm25,
            pm10,
            noise,
            co2
        )

        # =================================================
        # MySQL DB 연결
        # =================================================
        conn = pymysql.connect(**DB_CONFIG)

        with conn.cursor() as cursor:

            # =================================================
            # home_status 테이블 데이터 저장
            # =================================================
            sql = """
                INSERT INTO home_status
                (
                    DUST_PM10,
                    DUST_PM25,
                    TEMP,
                    HUM,
                    NOS,
                    CREATE_AT,
                    DST,
                    CST,
                    CS,
                    WIFI_COUNT,
                    location,
                    CO2,
                    SPACE_SCORE,
                    AI_MESSAGE,
                    STATUS_LEVEL
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            # =================================================
            # INSERT 할 실제 값들
            # =================================================
            values = (
                pm10,
                pm25,
                temp,
                hum,
                noise,
                formatted_time,
                dst_status,
                cst,
                cs,
                0,
                "동아리방",
                co2,
                space_score,
                ai_message,
                status_level
            )

            # SQL 실행
            cursor.execute(sql, values)

        # DB 저장 확정
        conn.commit()

        # =================================================
        # 콘솔 출력 로그
        # =================================================
        print(
            f"✔️ 저장 완료 | "
            f"시간={formatted_time}, "
            f"TEMP={temp}, "
            f"HUM={hum}, "
            f"PM10={pm10}, "
            f"PM25={pm25}, "
            f"NOS={noise}, "
            f"CO2={co2}, "
            f"DST={dst_status}, "
            f"CST={cst}, "
            f"CS={cs}, "
            f"SPACE_SCORE={space_score}, "
            f"STATUS_LEVEL={status_level}"
        )

    except Exception as e:

        print(f"❌ 에러 발생: {e}")

    finally:

        # DB 연결 종료
        if conn:
            conn.close()

# =========================================================
# MQTT 클라이언트 생성
# =========================================================
client = mqtt.Client(CallbackAPIVersion.VERSION2)

# 이벤트 연결
client.on_connect = on_connect
client.on_message = on_message

print("🚀 AWS 수집 서버 가동 중...")

# =========================================================
# DB 정보 확인 후 MQTT 연결
# =========================================================
if not DB_CONFIG["host"]:

    print("❌ 에러: .env 파일에서 DB 정보를 읽어올 수 없습니다!")

else:

    # MQTT 브로커 연결
    client.connect(MQTT_BROKER, 1883, 60)

    # 무한 대기하며 메시지 수신
    client.loop_forever()
