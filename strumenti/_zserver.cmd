@echo off
rem ---------------------------------------------------------------------------
rem Esegue zServer nella sua cartella. Non si lancia da solo: lo richiama
rem avvia-con-zserver.cmd nella scheda (o console) dedicata.
rem
rem   _zserver.cmd "<percorso di zServer.exe>"
rem
rem Se zServer termina con un errore, la finestra resta aperta con il codice
rem di uscita: senza la pausa la scheda si chiuderebbe prima di poter leggere
rem il messaggio. Un arresto normale (Ctrl+C) esce con 0 e chiude la scheda.
rem ---------------------------------------------------------------------------
setlocal
set "ZSERVER_EXE=%~f1"

if not exist "%ZSERVER_EXE%" (
  echo Non trovo zServer: "%ZSERVER_EXE%"
  pause
  exit /b 1
)

pushd "%~dp1"
echo === %ZSERVER_EXE%
echo     cartella di lavoro: %CD%
echo.
"%ZSERVER_EXE%"
set "ESITO=%ERRORLEVEL%"
popd

if not "%ESITO%"=="0" (
  echo.
  echo === zServer terminato con codice %ESITO%.
  echo     Se sopra non c'e' il motivo, guarda il registro di zServer nella sua cartella.
  pause
)
exit /b %ESITO%
