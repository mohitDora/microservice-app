import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is not set.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:3000/api/users")

PORT = int(os.getenv("PORT", 8000))
