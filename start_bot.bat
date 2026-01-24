@echo off
title Thankan Music Bot - Starting...
color 0A

echo ==================================================
echo       Thankan Music Bot - Startup Script
echo ==================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js v16 or higher.
    pause
    exit /b
)

:: Check for yt-dlp
if not exist "bin\yt-dlp.exe" (
    echo [WARNING] yt-dlp not found in bin folder. Attempting download...
    if not exist "bin" mkdir bin
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile 'bin\yt-dlp.exe'"
    if exist "bin\yt-dlp.exe" (
        echo [SUCCESS] yt-dlp downloaded successfully.
    ) else (
        echo [ERROR] Failed to download yt-dlp. Please download it manually to the 'bin' folder.
        pause
        exit /b
    )
) else (
    echo [INFO] yt-dlp found.
)

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

:: Build the project
echo [INFO] Building project...
call npm run build

:: Start the bot
echo.
echo [INFO] Starting Thankan Music Bot...
echo.
call npm start

pause
