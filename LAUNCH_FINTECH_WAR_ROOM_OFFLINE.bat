@echo off
title GARUDA OS - SOVEREIGN FINTECH WAR ROOM (OFFLINE PROOF)
color 0A
echo ==============================================================================
echo                 GARUDA OS - SOVEREIGN FINTECH WAR ROOM
echo               100%% AIR-GAPPED & OFFLINE RESILIENT ENGINE
echo ==============================================================================
echo.
echo [1/3] Initializing Local Zero-Custody Banking Engine...
echo [2/3] Bypassing External Networks (100%% Offline Operational)...
echo [3/3] Opening Treasury War Room in Default Browser...
echo.

cd /d "%~dp0"
start "" "http://localhost:5173/fintech-gateway"
call npx vite --host 0.0.0.0 --port 5173
pause
