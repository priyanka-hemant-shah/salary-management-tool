@echo off
echo ====================================================
echo Starting ACME Salary Intelligence Platform (Dev)
echo ====================================================

echo Starting Backend Server on http://127.0.0.1:8000...
start cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting Frontend Dev Server on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo App is launching. Open http://localhost:5173 in your browser!

