@echo off
echo ==================================================================
echo 🦅 GARUDA ALPHA-QUANT DAILY MARKET INTELLIGENCE DISPATCHER
echo ==================================================================
cd /d "D:\GARUDA-AI"
node scripts/dispatch-daily-quant-pulse.js %*
echo.
echo Market pulse dispatch complete.
