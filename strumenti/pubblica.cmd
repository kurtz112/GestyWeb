@echo off
rem ---------------------------------------------------------------------------
rem Compila e copia il risultato nella cartella servita dal server web.
rem Stesso schema di strumenti\pubblica.cmd di Agora.
rem
rem   pubblica.cmd "<cartella del sito>"            configurazione production
rem   pubblica.cmd "<cartella del sito>" development
rem
rem La copia e' un rispecchiamento (robocopy /MIR): nella cartella del sito
rem spariscono i file che la compilazione non produce piu'. Fanno eccezione
rem web.config (IIS) e config.json (configurazione dell'installazione, scritta
rem dal sistemista, vedi README.md), che restano dove sono.
rem
rem Proprio perche' cancella, si ferma prima di compilare se la cartella
rem del sito:
rem   - sta dentro la cartella del progetto, o la contiene;
rem   - contiene angular.json, package.json o file .ts (e' un sorgente: anche
rem     src\ ha un index.html, e senza questo controllo verrebbe svuotata);
rem   - non e' vuota e non contiene index.html (non e' un sito Angular).
rem ---------------------------------------------------------------------------
setlocal

if "%~1"=="" (
  echo Uso: pubblica.cmd "cartella del sito" [configurazione]
  exit /b 1
)
set "SITO=%~f1"
set "CONFIGURAZIONE=%~2"
if "%CONFIGURAZIONE%"=="" set "CONFIGURAZIONE=production"

call "%~dp0_ambiente.cmd" >nul || exit /b 1

rem Il sito non deve stare dentro il progetto, ne' contenerlo.
call set "RESTO=%%SITO:%GESTYWEB_RADICE%=%%"
if /i not "%RESTO%"=="%SITO%" goto rifiuta_progetto
call set "RESTO=%%GESTYWEB_RADICE:%SITO%=%%"
if /i not "%RESTO%"=="%GESTYWEB_RADICE%" goto rifiuta_progetto

if exist "%SITO%\" (
  if exist "%SITO%\angular.json" goto rifiuta_sorgente
  if exist "%SITO%\package.json" goto rifiuta_sorgente
  dir /s /b /a-d "%SITO%\*.ts" >nul 2>nul && goto rifiuta_sorgente
  if not exist "%SITO%\index.html" (
    dir /b /a "%SITO%" | findstr . >nul && goto rifiuta_non_sito
  )
)

call "%~dp0compila.cmd" %CONFIGURAZIONE% || exit /b 1

set "USCITA=%GESTYWEB_RADICE%\dist\gestyweb\browser"
if not exist "%USCITA%\index.html" (
  echo Dopo la compilazione manca "%USCITA%\index.html".
  exit /b 1
)

echo === Copia in %SITO%
robocopy "%USCITA%" "%SITO%" /MIR /XF web.config config.json /R:1 /W:1 /NFL /NDL /NP
if errorlevel 8 (
  echo Copia NON riuscita.
  exit /b 1
)
echo Pubblicato in %SITO%
exit /b 0

:rifiuta_progetto
echo "%SITO%" e la cartella del progetto si sovrappongono: scegli una cartella del sito fuori dal progetto.
exit /b 1

:rifiuta_sorgente
echo "%SITO%" contiene sorgenti (angular.json, package.json o file .ts): non e' una cartella del sito, mi fermo.
exit /b 1

:rifiuta_non_sito
echo "%SITO%" non e' vuota e non contiene index.html: non sembra un sito Angular, mi fermo.
exit /b 1
