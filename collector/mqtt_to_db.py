import os
import pymysql
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
import json
import smtplib
import time
from email.mime.text import MIMEText
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from pywebpush import webpush, WebPushException
from urllib.parse import urlparse
import schedule
import threading

# ================== .env 파일 불러오기 ==================
load_dotenv()

# ================== 기준치 설정 ==================
THRESHOLDS = {
    "PM25_BAD": 35,          # 미세먼지 임계값
    "PM25_NORMAL": 15,
    "PM10_BAD": 80,
    "NOISE_CONGESTED": 55,   # 소음 임계값
    "NOISE_NORMAL": 10,
    "NOISE_HIGH": 55,        # 소음 임계값
    "CO2_BAD": 1000,         # CO2 기본 임계값 (DB 설정이 우선됨)
    "TEMP_HIGH_ALERT": 27,   # 최고 온도 임계값
    "TEMP_LOW_ALERT": 18,
    "TEMP_OPTIMAL_MIN": 22,
    "TEMP_OPTIMAL_MAX": 27,
    "HUM_HIGH_ALERT": 70,
    "HUM_LOW_ALERT": 30,
    "HUM_OPTIMAL_MIN": 40,
    "HUM_OPTIMAL_MAX": 60
}

# ================== MQTT 설정 ==================
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_TOPIC = "myroom/sensor/data"

# ================== DB 연결 정보 ==================
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "db": os.getenv("DB_NAME"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor
}

# ================== 알림 쿨타임 변수 ==================
last_email_sent_time = 0

# ================== 이메일 발송 함수 ==================
def send_email(to_email, subject, body):
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = os.getenv("EMAIL_USER")
        msg['To'] = to_email
        
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            server.sendmail(os.getenv("EMAIL_USER"), to_email, msg.as_string())
        print(f"📧 이메일 발송 성공: {to_email}")
    except Exception as e:
        print(f"❌ 이메일 발송 실패: {e}")

# ================== 리포트 발송 로직 ==================
def send_report(report_type):
    days = 1 if report_type == 'daily' else 7
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            # 설정 확인 (DAILY_REPORT, WEEKLY_REPORT 컬럼 사용)
            cursor.execute("SELECT USER_EMAIL, DAILY_REPORT, WEEKLY_REPORT FROM app_settings LIMIT 1")
            settings = cursor.fetchone()
            
            if not settings: return
            
            # 리포트 기능 활성화 여부 확인
            is_enabled = settings['DAILY_REPORT'] if report_type == 'daily' else settings['WEEKLY_REPORT']
            if not is_enabled: return

            # 데이터 평균 계산
            query = f"""
                SELECT AVG(TEMP) as avg_temp, AVG(HUM) as avg_hum, AVG(CO2) as avg_co2, 
                       AVG(DUST_PM25) as avg_pm25, AVG(DUST_PM10) as avg_pm10 
                FROM home_status 
                WHERE CREATE_AT >= NOW() - INTERVAL {days} DAY
            """
            cursor.execute(query)
            data = cursor.fetchone()
            
            if not data or data['avg_temp'] is None: return 

            # 이메일 전송
            title = f"[Clean-Sync] {'일일' if report_type == 'daily' else '주간'} 리포트"
            body = f"""
            안녕하세요, Clean-Sync {report_type} 리포트입니다.

            최근 {'하루' if report_type == 'daily' else '일주일'} 동안의 평균 실내 환경 데이터입니다.

            - 온도: {data['avg_temp']:.1f}°C
            - 습도: {data['avg_hum']:.1f}%
            - CO2 농도: {data['avg_co2']:.1f} ppm
            - 미세먼지(PM2.5): {data['avg_pm25']:.1f} µg/m³
            - 미세먼지(PM10): {data['avg_pm10']:.1f} µg/m³

            Clean-Sync를 이용해주셔서 감사합니다.
            """
            send_email(settings['USER_EMAIL'], title, body)
            print(f"📄 {report_type} 리포트 발송 완료!")
    except Exception as e:
        print(f"❌ 리포트 발송 중 에러: {e}")
    finally:
        if conn: conn.close()

# ================== 스케줄러 설정 ==================
def run_scheduler():
    # 매일 09:00 일일 리포트
    schedule.every().day.at("09:00").do(lambda: send_report('daily'))
    # 매주 월요일 09:00 주간 리포트
    schedule.every().monday.at("09:00").do(lambda: send_report('weekly'))
    
    while True:
        schedule.run_pending()
        time.sleep(60)

# ================== 웹 푸시 발송 함수 (수정됨) ==================
def send_web_push(subscription_info, message):
    if not subscription_info:
        return
    try:
        sub_info = json.loads(subscription_info)
        
        endpoint = sub_info.get('endpoint', '')
        if not endpoint:
            print("❌ 오류: DB에 endpoint 정보가 없습니다.")
            return

        parsed_url = urlparse(endpoint)
        aud = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        vapid_key = os.getenv("VAPID_PRIVATE_KEY")
        if not vapid_key:
            print("❌ 오류: .env 파일에 VAPID_PRIVATE_KEY가 없습니다!")
            return
            
        webpush(
            subscription_info=sub_info,
            data=message,
            vapid_private_key=vapid_key.strip(),
            vapid_claims={
                "sub": f"mailto:{os.getenv('EMAIL_USER')}",
                "aud": aud
            },
            ttl=3600  # 400 Bad Request 해결을 위해 TTL 추가
        )
        print("📱 웹 푸시 발송 성공!")
    except Exception as e:
        print(f"❌ 웹 푸시 발송 실패: {e}")

# =========================================================
# 상태 계산 로직
# =========================================================
def calc_dust_status(pm25):
    if pm25 > THRESHOLDS["PM25_BAD"]: return "나쁨"
    elif pm25 > THRESHOLDS["PM25_NORMAL"]: return "보통"
    else: return "좋음"

def calc_congestion(noise):
    if noise <= THRESHOLDS["NOISE_NORMAL"]: return "여유"
    elif noise <= THRESHOLDS["NOISE_CONGESTED"]: return "보통"
    else: return "혼잡"

def calc_congestion_score(noise):
    if noise < THRESHOLDS["NOISE_NORMAL"]: return 30
    elif noise < THRESHOLDS["NOISE_CONGESTED"]: return 60
    else: return 90

def calc_space_score(co2, noise, temp, hum, pm25):
    score = 100
    if co2 > THRESHOLDS["CO2_BAD"]: score -= min(((co2 - THRESHOLDS["CO2_BAD"]) / 100) * 5, 30)
    if noise > THRESHOLDS["NOISE_HIGH"]: score -= min(((noise - THRESHOLDS["NOISE_HIGH"]) / 5) * 5, 25)
    
    if temp < THRESHOLDS["TEMP_OPTIMAL_MIN"]: score -= min((THRESHOLDS["TEMP_OPTIMAL_MIN"] - temp) * 3, 15)
    elif temp > THRESHOLDS["TEMP_OPTIMAL_MAX"]: score -= min((temp - THRESHOLDS["TEMP_OPTIMAL_MAX"]) * 3, 15)
    
    if hum < THRESHOLDS["HUM_OPTIMAL_MIN"]: score -= min((THRESHOLDS["HUM_OPTIMAL_MIN"] - hum) * 1, 10)
    elif hum > THRESHOLDS["HUM_OPTIMAL_MAX"]: score -= min((hum - THRESHOLDS["HUM_OPTIMAL_MAX"]) * 1, 10)
    
    if pm25 > THRESHOLDS["PM25_BAD"]: score -= 10
    return max(0, round(score))

def calc_status_level(space_score):
    if space_score >= 90: return "매우 쾌적"
    elif space_score >= 75: return "쾌적"
    elif space_score >= 60: return "보통"
    elif space_score >= 40: return "나쁨"
    else: return "매우 나쁨"

def calc_ai_message(temp, hum, pm25, pm10, noise, co2):
    messages = []
    if temp >= THRESHOLDS["TEMP_HIGH_ALERT"]: messages.append("온도가 높습니다.")
    elif temp <= THRESHOLDS["TEMP_LOW_ALERT"]: messages.append("온도가 낮습니다.")
    if hum >= THRESHOLDS["HUM_HIGH_ALERT"]: messages.append("습도가 높습니다.")
    elif hum <= THRESHOLDS["HUM_LOW_ALERT"]: messages.append("습도가 낮습니다.")
    if pm25 > THRESHOLDS["PM25_BAD"] or pm10 > THRESHOLDS["PM10_BAD"]: messages.append("미세먼지 농도가 높습니다.")
    if noise >= THRESHOLDS["NOISE_HIGH"]: messages.append("소음이 큽니다.")
    if co2 >= THRESHOLDS["CO2_BAD"]: messages.append("이산화탄소 농도가 높습니다.")
    if len(messages) == 0: return "현재 실내 환경이 쾌적합니다."
    return " ".join(messages)

# =========================================================
# MQTT 연결 성공 시 실행
# =========================================================
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ MQTT 브로커 연결 성공!")
        client.subscribe(MQTT_TOPIC)
        print(f"📡 구독 토픽: {MQTT_TOPIC}")
    else:
        print(f"❌ 연결 실패 (코드: {reason_code})")

# =========================================================
# MQTT 메시지 수신 시 실행
# =========================================================
def on_message(client, userdata, msg):
    global last_email_sent_time
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

        temp, hum, pm25, pm10, noise, co2 = float(data["temp"]), float(data["humi"]), float(data["pm25"]), float(data["pm10"]), float(data["sound"]), float(data["co2"])
        
        kst_now = datetime.now(timezone.utc) + timedelta(hours=9)
        formatted_time = kst_now.strftime("%Y-%m-%d %H:%M:%S")

        dst_status, cst, cs = calc_dust_status(pm25), calc_congestion(noise), calc_congestion_score(noise)
        space_score = calc_space_score(co2, noise, temp, hum, pm25)
        status_level = calc_status_level(space_score)
        ai_message = calc_ai_message(temp, hum, pm25, pm10, noise, co2)

        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            # 1. 먼저 기기 연결 상태 및 설정 조회
            query = """
                SELECT DEVICE_STATUS, USER_EMAIL, EMAIL_ALERT, PUSH_ALERT,
                       CO2_THRESHOLD, NOS_THRESHOLD, TEMP_THRESHOLD, DUST_THRESHOLD, PUSH_SUBSCRIPTION 
                FROM app_settings LIMIT 1
            """
            cursor.execute(query)
            user_setting = cursor.fetchone()

            # 연결 상태 확인
            if not user_setting or user_setting['DEVICE_STATUS'] != '연결됨':
                print("🛑 기기 연결 해제 상태 - 데이터 수집 중단")
                return

            # 2. 데이터 저장
            sql = """
                INSERT INTO home_status 
                (DUST_PM10, DUST_PM25, TEMP, HUM, NOS, CREATE_AT, DST, CST, CS, WIFI_COUNT, location, CO2, SPACE_SCORE, AI_MESSAGE, STATUS_LEVEL)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (pm10, pm25, temp, hum, noise, formatted_time, dst_status, cst, cs, 0, "동아리방", co2, space_score, ai_message, status_level)
            cursor.execute(sql, values)

            # 3. 알림 로직 (위에서 조회한 user_setting 활용)
            current_time = time.time()
            
            # --- 쿨타임 (1800초 = 30분) ---
            if current_time - last_email_sent_time > 1800:
                alerts = []
                
                if co2 > user_setting['CO2_THRESHOLD']: 
                    alerts.append(f"- CO2: {co2}ppm")
                if noise > user_setting['NOS_THRESHOLD']: 
                    alerts.append(f"- 소음: {noise}dB")
                if temp > user_setting['TEMP_THRESHOLD']: 
                    alerts.append(f"- 온도: {temp}°C")
                if pm25 > user_setting['DUST_THRESHOLD']: 
                    alerts.append(f"- 미세먼지: {pm25}µg/m³")

                if alerts:
                    full_msg = "데이터가 임계치에 도달하였습니다. Clean-Sync을 통해 확인하세요!"
                    
                    # 이메일 알림
                    if user_setting['EMAIL_ALERT'] == 1:
                        send_email(
                            user_setting['USER_EMAIL'], 
                            "[Clean-Sync] 실내 환경 경고 알림", 
                            full_msg
                        )
                    
                    # 푸시 알림
                    if user_setting['PUSH_ALERT'] == 1 and user_setting['PUSH_SUBSCRIPTION']:
                        send_web_push(user_setting['PUSH_SUBSCRIPTION'], full_msg)
                        
                    last_email_sent_time = current_time
        
        conn.commit()
        print(f"✔️ 저장 완료 | {formatted_time} | CO2={co2}")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
    finally:
        if conn: conn.close()

# =========================================================
# MQTT 클라이언트 생성 및 가동
# =========================================================
client = mqtt.Client(CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print("🚀 AWS 수집 서버 가동 중...")

# 스케줄러 스레드 시작
threading.Thread(target=run_scheduler, daemon=True).start()

if not DB_CONFIG["host"]:
    print("❌ 에러: .env 파일에서 DB 정보를 읽어올 수 없습니다!")
else:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()