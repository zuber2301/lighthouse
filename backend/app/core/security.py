from passlib.context import CryptContext

# Use pbkdf2_sha256 to avoid requiring the native `bcrypt` package inside containers.
# This is a pragmatic choice for development environments; pbkdf2_sha256 is
# widely supported and does not require C extensions.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)
