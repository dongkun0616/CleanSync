import os
import pymysql
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion # 버전 명시를 위해 추가
import json
from dotenv import load_dotenv

# --- [설정 로드] ---
# .env 파일의 내용을 환경 변수로 불러옵니다.
load_dotenv()

# 환경 변수에서 설정값 가져오기
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_TOPIC = "myroom/sensor/data"

# DB 설정 (환경 변수 사용)
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
        
        # 미세먼지 상태 계산
        dst_status = "좋음"
        if data['pm25'] > 35: dst_status = "나쁨"
        elif data['pm25'] > 15: dst_status = "보통"

        # DB 연결 및 저장
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            sql = """INSERT INTO home_status 
                     (DUST_PM10, DUST_PM25, TEMP, HUM, NOS, DST, CST, CS, WIFI_COUNT, location) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            
            cursor.execute(sql, (
                data['pm10'], data['pm25'], data['temp'], data['humi'], data['sound'],
                dst_status, "쾌적", 0, 0, "TEST"
            ))
        conn.commit()
        conn.close()
        print(f"✔️ RDS(iot_db) 저장 완료: {data['temp']}°C / PM2.5: {data['pm25']}")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")

# MQTT 클라이언트 설정
client = mqtt.Client(CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print("🚀 AWS 수집 서버 가동 중 (보안 모드)...")

# 설정값이 정상적으로 로드되었는지 확인
if not DB_CONFIG['host']:
    print("❌ 에러: .env 파일에서 정보를 읽어올 수 없습니다!")
else:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()