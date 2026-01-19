@echo off
echo ⚙️  Starting Ed-TechyX Backend...
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo 📝 Creating from .env.example...
    copy .env.example .env
    echo ✅ .env created. Please edit it with your MongoDB, Firebase credentials.
    echo.
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

echo 🚀 Starting server on http://localhost:9000
call npm run dev
