import base64
from Cryptodome.Cipher import AES
from Cryptodome.Util.Padding import unpad

# In a real scenario, this key would be loaded from environment variables
# Must be exactly 32 bytes for AES-256
SECRET_KEY = b"12345678901234567890123456789012"

def decrypt_payload(encrypted_b64: str) -> bytes:
    """
    Decrypt an AES-256-CBC encrypted base64 payload.
    The payload is expected to have the IV as the first 16 bytes when decoded.
    """
    try:
        raw_data = base64.b64decode(encrypted_b64)
        if len(raw_data) < 16:
            raise ValueError("Payload too short to contain IV")
        
        iv = raw_data[:16]
        encrypted_bytes = raw_data[16:]
        
        cipher = AES.new(SECRET_KEY, AES.MODE_CBC, iv)
        decrypted_padded = cipher.decrypt(encrypted_bytes)
        decrypted_bytes = unpad(decrypted_padded, AES.block_size)
        
        return decrypted_bytes
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")
