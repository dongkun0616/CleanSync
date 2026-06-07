from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# 1. 개인키 생성 (EC SECP256R1 - VAPID 표준)
private_key = ec.generate_private_key(ec.SECP256R1())

# 2. PEM 형식으로 개인키 저장
pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

with open("private_key.pem", "wb") as f:
    f.write(pem)

# 3. 공개키 도출 및 Base64 인코딩
public_key = private_key.public_key()
public_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)
public_key_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')

print("✅ private_key.pem 파일이 성공적으로 생성되었습니다.")
print("-" * 50)
print("👉 [중요] 아래 공개키(Public Key)를 프론트엔드 코드에 적용하세요:")
print(public_key_b64)
print("-" * 50)