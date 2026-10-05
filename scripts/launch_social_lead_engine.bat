@echo off
echo ================================================================== >> "D:\GARUDA-AI\logs\social-engine.log"
echo [GARUDA SOCIAL LEAD ENGINE] Launching at %date% %time% >> "D:\GARUDA-AI\logs\social-engine.log"
echo ================================================================== >> "D:\GARUDA-AI\logs\social-engine.log"
cd /d "D:\GARUDA-AI"
node social-engine/index.js >> "D:\GARUDA-AI\logs\social-engine.log" 2>&1
echo [GARUDA SOCIAL LEAD ENGINE] Process exited at %date% %time% with code %ERRORLEVEL% >> "D:\GARUDA-AI\logs\social-engine.log"
