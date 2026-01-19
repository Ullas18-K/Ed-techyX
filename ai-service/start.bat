@echo off
echo 🤖 Starting Ed-TechyX AI Service...
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo 📝 Creating from .env.example...
    copy .env.example .env
    echo ✅ .env created. Please edit it with your GCP credentials.
    echo.
)

REM Check if virtual environment exists
if not exist venv (
    echo 🐍 Creating virtual environment...
    python -m venv venv
    echo.
)

echo 📦 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📦 Installing dependencies...
pip install -r requirements.txt

echo.
echo 🚀 Starting AI service on http://localhost:8000
uvicorn main:app --reload --port 8000
