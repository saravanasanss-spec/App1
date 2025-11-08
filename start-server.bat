@echo off
echo ========================================
echo   Digital Studio Shop - Local Server
echo ========================================
echo.
echo Starting server on port 8000...
echo.
echo Your website will be available at:
echo   http://localhost:8000
echo.
echo To access from mobile:
echo   1. Make sure mobile is on same WiFi
echo   2. Find your IP address below
echo   3. Open http://YOUR_IP:8000 on mobile
echo.
echo Finding your IP address...
echo.
ipconfig | findstr IPv4
echo.
echo ========================================
echo   Press Ctrl+C to stop the server
echo ========================================
echo.
python -m http.server 8000
pause

