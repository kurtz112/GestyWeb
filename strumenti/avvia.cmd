@echo off
rem ---------------------------------------------------------------------------
rem Avvia il server di sviluppo di Angular, che ricompila a ogni salvataggio.
rem
rem   avvia.cmd                       development sulla porta 4201
rem   avvia.cmd development 4300      configurazione e porta a scelta
rem
rem Porta 4201 e non 4200: cosi' GestyWeb e Agora possono girare insieme.
rem Si apre http://localhost:<porta>/ nel browser. Ctrl+C per fermarlo.
rem L'indirizzo di zServer e' apiUrl in src\environments\environment.ts.
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || exit /b 1

if not exist "%GESTYWEB_NG%" (
  echo Manca node_modules in "%GESTYWEB_RADICE%".
  exit /b 1
)

set "CONFIGURAZIONE=%~1"
if "%CONFIGURAZIONE%"=="" set "CONFIGURAZIONE=development"
set "PORTA=%~2"
if "%PORTA%"=="" set "PORTA=4201"

pushd "%GESTYWEB_RADICE%"
echo === ng serve --configuration %CONFIGURAZIONE% --port %PORTA%
node "%GESTYWEB_NG%" serve --configuration %CONFIGURAZIONE% --port %PORTA%
set "ESITO=%ERRORLEVEL%"
popd
exit /b %ESITO%
