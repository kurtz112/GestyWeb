@echo off
rem ---------------------------------------------------------------------------
rem Installa node_modules. Stesso schema di strumenti\installa-dipendenze.cmd
rem di Agora.
rem
rem   installa-dipendenze.cmd
rem
rem Con package-lock.json usa "npm ci": cancella node_modules e reinstalla
rem esattamente le versioni bloccate, cioe' quelle gia' provate in SandBox.
rem Senza package-lock.json usa "npm install", che crea il file di blocco.
rem
rem Va rilanciato ogni volta che un rilascio cambia package.json o
rem package-lock.json.
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || exit /b 1

pushd "%GESTYWEB_RADICE%"
if exist package-lock.json (
  echo === npm ci
  call npm ci
) else (
  echo === npm install: manca package-lock.json, viene creato adesso
  call npm install
)
set "ESITO=%ERRORLEVEL%"
popd

if not "%ESITO%"=="0" (
  echo Installazione delle dipendenze NON riuscita, codice %ESITO%.
  exit /b %ESITO%
)
if not exist "%GESTYWEB_NG%" (
  echo Installazione finita, ma manca node_modules\@angular\cli.
  exit /b 1
)
echo Dipendenze installate.
exit /b 0
