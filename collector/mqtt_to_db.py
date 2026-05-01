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
        # UTC 시간에 9시간을 더해 한국 시간을 만듭니다.
        kst_now = datetime.utcnow() + timedelta(hours=9)
        # DB에 넣기 좋은 문자열 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
        formatted_time = kst_now.strftime('%Y-%m-%d %H:%M:%S')

        # 미세먼지 상태 계산
        dst_status = "좋음"
        if data['pm25'] > 35: dst_status = "나쁨"
        elif data['pm25'] > 15: dst_status = "보통"

        # DB 연결 및 저장
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            # 컬럼명을 이미지와 똑같이 CREATE_AT 으로 수정했습니다.
            sql = """INSERT INTO home_status 
                     (DUST_PM10, DUST_PM25, TEMP, HUM, NOS, CREATE_AT, DST, CST, CS, WIFI_COUNT, location) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            
            cursor.execute(sql, (
                data['pm10'], data['pm25'], data['temp'], data['humi'], data['sound'],
                formatted_time,  # 위에서 만든 한국 시간이 CREATE_AT 컬럼에 들어갑니다.
                dst_status, "쾌적", 0, 0, "TEST"
            ))
        conn.commit()
        conn.close()
        print(f"✔️ RDS(iot_db) 저장 완료: {formatted_time} | {data['temp']}°C")

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