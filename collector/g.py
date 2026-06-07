from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# 키 생성
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# 개인키 직렬화
priv_bytes = private_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# 공개키 직렬화
pub_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)

# Base64 URL 인코딩 (VAPID 표준 형식)
print("--- [새로 발급된 VAPID 키] ---")
print("Private Key (ENV에 넣을 값):", base64.urlsafe_b64encode(priv_bytes).decode().rstrip('='))
print("Public Key (프론트엔드에 넣을 값):", base64.urlsafe_b64encode(pub_bytes).decode().rstrip('='))