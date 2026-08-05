import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from backend/.env or careflow/.env
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AfterCare AI — Smarter Recovery"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./careflow.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "9f71c4c1a403ffebef871b6d08064b5ea3f510ffb75fef8728b9d3b484501a3d")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        case_sensitive = True

settings = Settings()
