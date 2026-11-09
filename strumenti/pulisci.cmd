@echo off
rem ---------------------------------------------------------------------------
rem Cancella i file prodotti dalla compilazione. Stesso schema di
rem strumenti\pulisci.cmd di Agora.
rem
rem   pulisci.cmd                  dist e la cache di .angular
rem   pulisci.cmd tutto            anche node_modules (poi installa-dipendenze.cmd)
rem ---------------------------------------------------------------------------
setlocal
for %%I in ("%~dp0..") do set "GESTYWEB_RADICE=%%~fI"

if not exist "%GESTYWEB_RADICE%\angular.json" (
  echo In "%GESTYWEB_RADICE%" non c'e' angular.json: strumenti\ deve stare nella cartella del progetto.
  exit /b 1
)

for %%D in (dist .angular out-tsc coverage) do (
  if exist "%GESTYWEB_RADICE%\%%D\" (
    echo Cancello %%D
    rd /s /q "%GESTYWEB_RADICE%\%%D"
  )
)
if /i "%~1"=="tutto" if exist "%GESTYWEB_RADICE%\node_modules\" (
  echo Cancello node_modules
  rd /s /q "%GESTYWEB_RADICE%\node_modules"
)
echo Fatto.
exit /b 0
