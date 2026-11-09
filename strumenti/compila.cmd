@echo off
rem ---------------------------------------------------------------------------
rem Compila il progetto.
rem
rem   compila.cmd                  configurazione production
rem   compila.cmd development      senza ottimizzazione, con mappe dei sorgenti
rem
rem Uscita in dist\ (cartella indicata da outputPath in angular.json).
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || exit /b 1

if not exist "%GESTYWEB_NG%" (
  echo Manca node_modules in "%GESTYWEB_RADICE%".
  exit /b 1
)

set "CONFIGURAZIONE=%~1"
if "%CONFIGURAZIONE%"=="" set "CONFIGURAZIONE=production"

pushd "%GESTYWEB_RADICE%"
echo === ng build --configuration %CONFIGURAZIONE%
node "%GESTYWEB_NG%" build --configuration %CONFIGURAZIONE%
set "ESITO=%ERRORLEVEL%"
popd

if not "%ESITO%"=="0" (
  echo Compilazione %CONFIGURAZIONE% NON riuscita, codice %ESITO%.
  exit /b %ESITO%
)
echo Compilazione %CONFIGURAZIONE% riuscita: %GESTYWEB_RADICE%\dist
exit /b 0
