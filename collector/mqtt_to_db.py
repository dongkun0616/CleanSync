import os
import pymysql
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
import json
from dotenv import load_dotenv
# --- [시간 관련 모듈 추가] ---
from datetime import datetime, timedelta

# --- [설정 로드] ---
load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_TOPIC = "myroom/sensor/data"

DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'db': os.getenv("DB_NAME"),
    'charset': 'utf8mb4'
}

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ MQTT 브로커 연결 성공!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"❌ 연결 실패 (코드: {reason_code})")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        
        # --- [1. 한국 시간 계산] ---
        kst_now = datetime.utcnow() + timedelta(hours=9)
        formatted_time = kst_now.strftime('%Y-%m-%d %H:%M:%S')

        # 미세먼지 상태 계산
        dst_status = "좋음"
        if data['pm25'] > 35: dst_status = "나쁨"
        elif data['pm25'] > 15: dst_status = "보통"

        # DB 연결
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            # --- [트리거 대신 수행: 기존 로그 삭제] ---
            cursor.execute("DELETE FROM statistics_logs")

            # 1. 전체 이력 저장 (home_status)
            sql_home = """INSERT INTO home_status 
                         (DUST_PM10, DUST_PM25, TEMP, HUM, NOS, CREATE_AT, DST, CST, CS, WIFI_COUNT, location) 
                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            
            home_values = (
                data['pm10'], data['pm25'], data['temp'], data['humi'], data['sound'],
                formatted_time, dst_status, "쾌적", 0, 0, "TEST"
            )
            cursor.execute(sql_home, home_values)

            # 2. 최신 상태 저장 (statistics_logs) - 이미지의 컬럼명에 맞춤
            sql_stats = """INSERT INTO statistics_logs 
                          (DUST_PM10, DUST_PM25, TEMP, HUM, NOS, DST, CREATE_AT, location) 
                          VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
            
            stats_values = (
                data['pm10'], data['pm25'], data['temp'], data['humi'], data['sound'],
                dst_status, formatted_time, "TEST"
            )
            cursor.execute(sql_stats, stats_values)

        conn.commit()
        conn.close()
        print(f"✔️ RDS 데이터 갱신 완료: {formatted_time} | 온도: {data['temp']}°C")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")

# ... (아래 MQTT 클라이언트 설정 부분은 동일) ...
client = mqtt.Client(CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print("🚀 AWS 수집 서버 가동 중 (한국 시간 보정 모드)...")

if not DB_CONFIG['host']:
    print("❌ 에러: .env 파일에서 정보를 읽어올 수 없습니다!")
else:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()