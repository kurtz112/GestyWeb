@echo off
rem ---------------------------------------------------------------------------
rem Avvia zServer di Gesty e il server di sviluppo di Angular, ciascuno nella
rem sua scheda della stessa finestra di Windows Terminal. Stesso schema di
rem strumenti\avvia-con-zserver.cmd di Agora.
rem
rem   avvia-con-zserver.cmd                    development sulla porta 4201
rem   avvia-con-zserver.cmd development 4300   come avvia.cmd
rem
rem L'eseguibile di zServer e' GESTYWEB_ZSERVER; se non e' impostato si usa
rem quello di sviluppo di Gesty.
rem
rem Differenza da Agora: zServer di WT e zServer di Gesty si chiamano tutti e
rem due zServer.exe, quindi il controllo non si fa sul nome del processo ma
rem sulla porta. Nella SandBox lo zServer di Gesty ascolta sulla 8444
rem (serverPort del suo zServer.json, apiUrl di src\environments\environment.ts),
rem quello di WT sulla 8443: i due possono girare insieme. Se la 8444 e' gia'
rem occupata, zServer di Gesty e' gia' acceso e si avvia solo GestyWeb.
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || goto Errore

if not defined GESTYWEB_ZSERVER set "GESTYWEB_ZSERVER=X:\zServer\_bin\Gesty\Debug\Win64\zServer.exe"
set "ZSERVER_PORTA=8444"
set "GESTYWEB_WT_POS=1146,1318"
set "GESTYWEB_WT_SIZE=80,19"

if not exist "%GESTYWEB_ZSERVER%" (
  echo Non trovo zServer: "%GESTYWEB_ZSERVER%"
  echo Compilalo, oppure imposta GESTYWEB_ZSERVER con il percorso giusto.
  goto Errore
)

for %%I in ("%GESTYWEB_ZSERVER%") do set "ZSERVER_CARTELLA=%%~dpI"
rem La cartella senza la barra finale: "X:\...\Win64\" chiuso fra virgolette
rem diventerebbe una virgoletta protetta per chi legge la riga di comando.
set "ZSERVER_CARTELLA=%ZSERVER_CARTELLA:~0,-1%"

set ZSERVER_AVVIO=cmd /c call "%~dp0_zserver.cmd" "%GESTYWEB_ZSERVER%"

set "PORTA_OCCUPATA=0"
netstat -ano -p tcp | find ":%ZSERVER_PORTA% " | find "LISTENING" >nul && set "PORTA_OCCUPATA=1"
if "%PORTA_OCCUPATA%"=="1" (
  echo zServer di Gesty e' gia' in ascolto sulla %ZSERVER_PORTA%: avvio solo GestyWeb.
)

where wt.exe >nul 2>nul
if errorlevel 1 goto SenzaTerminal

if defined WT_SESSION goto DentroTerminal

rem Lanciato fuori da Windows Terminal (doppio clic, cmd classico): si apre
rem una finestra nuova con le due schede e questa console finisce qui.

if "%PORTA_OCCUPATA%"=="1" (
  wt.exe -w new --pos %GESTYWEB_WT_POS% --size %GESTYWEB_WT_SIZE% new-tab --title "GestyWeb" -d "%GESTYWEB_RADICE%" cmd /k call "%~dp0avvia.cmd" %*
) else (
  wt.exe -w new --pos %GESTYWEB_WT_POS% --size %GESTYWEB_WT_SIZE% new-tab --title "zServer Gesty" -d "%ZSERVER_CARTELLA%" %ZSERVER_AVVIO% ; new-tab --title "GestyWeb" -d "%GESTYWEB_RADICE%" cmd /k call "%~dp0avvia.cmd" %*
)

if errorlevel 1 (
  echo Windows Terminal non e' partito.
  goto Errore
)
exit /b 0

:DentroTerminal
if "%PORTA_OCCUPATA%"=="0" (
  echo === zServer nella scheda accanto: %GESTYWEB_ZSERVER%
  wt.exe -w 0 new-tab --title "zServer Gesty" -d "%ZSERVER_CARTELLA%" %ZSERVER_AVVIO%
  if errorlevel 1 echo Windows Terminal non ha aperto la scheda di zServer.
)
call "%~dp0avvia.cmd" %*
exit /b %ERRORLEVEL%

:SenzaTerminal
if "%PORTA_OCCUPATA%"=="0" (
  echo === zServer in una finestra separata: %GESTYWEB_ZSERVER%
  start "zServer Gesty" /d "%ZSERVER_CARTELLA%" %ZSERVER_AVVIO%
)
call "%~dp0avvia.cmd" %*
exit /b %ERRORLEVEL%

:Errore
echo.
echo === Avvio interrotto.
pause
exit /b 1
