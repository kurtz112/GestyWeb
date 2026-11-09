@echo off
rem ---------------------------------------------------------------------------
rem Controlli sul codice: ESLint su tutto il progetto.
rem
rem   verifica.cmd            controlla
rem   verifica.cmd correggi   controlla e sistema da solo quello che si puo'
rem                           (formattazione di Prettier, ordine degli import)
rem
rem Stesso schema di strumenti\verifica.cmd di Agora, senza i test: GestyWeb
rem non ha ancora un banco di prova (karma/jasmine).
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || exit /b 1

set "ESLINT=%GESTYWEB_RADICE%\node_modules\eslint\bin\eslint.js"
if not exist "%ESLINT%" (
  echo Manca ESLint in node_modules: lancia prima installa-dipendenze.cmd
  exit /b 1
)

set "OPZIONI="
if /i "%~1"=="correggi" set "OPZIONI=--fix"

pushd "%GESTYWEB_RADICE%"
echo === eslint %OPZIONI%
node "%ESLINT%" . %OPZIONI%
set "ESITO=%ERRORLEVEL%"
popd

if "%ESITO%"=="0" (
  echo Verifica riuscita.
) else (
  echo Verifica con errori: guarda i messaggi sopra.
)
exit /b %ESITO%
