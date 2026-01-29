@echo off
echo ==========================================
echo   AUDITOR DIARIO - ACCOUNT EXPRESS
echo ==========================================
cd /d "%~dp0.."
echo Ejecutando auditoria y actualizacion...
node estado_sistema/auditor_diario.js
echo.
echo Proceso finalizado. Cerrando en 5 segundos...
timeout /t 5
