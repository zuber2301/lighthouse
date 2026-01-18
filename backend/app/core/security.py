from passlib.context import CryptContext

# Use bcrypt_sha256 to avoid bcrypt's 72-byte input limitation for long passwords.
# bcrypt_sha256 hashes the input with SHA-256 before applying bcrypt.
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)
