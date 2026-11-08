@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Installez Node.js 24 pour demarrer Maison Veyre.
  pause
  exit /b 1
)
echo Ouvrez l'adresse affichee ci-dessous dans votre navigateur.
echo Laissez cette fenetre ouverte pendant votre visite.
node server\local.mjs
if errorlevel 1 pause
