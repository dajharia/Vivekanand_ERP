@echo off

:: 1. Backend Server (FastAPI)
echo Starting Backend Server (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d E:\Vivekanand\backend && venv\Scripts\activate && uvicorn app.main:app --reload"

:: 2. Frontend Server (Next.js) के लिए मेमोरी लिमिट सेट करें
echo Starting Frontend Server (Next.js)...
:: यहाँ हमने NODE_OPTIONS जोड़ा है ताकि RAM की कमी से ब्राउज़र हैंग न हो
start "Frontend - Next.js" cmd /k "cd /d E:\Vivekanand\frontend && set NODE_OPTIONS=--max-old-space-size=4096 && npm run dev"

echo.
echo ===================================================
echo     Both servers are starting up!
echo     Backend running at:  http://127.0.0.1:8000
echo     Frontend running at: http://localhost:3000
echo ===================================================
echo.
pause