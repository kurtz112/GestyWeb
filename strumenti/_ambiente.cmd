@echo off
rem ---------------------------------------------------------------------------
rem Ambiente comune agli script di strumenti\. Non si lancia da solo: gli
rem altri script lo richiamano con "call", dopo il loro setlocal.
rem Stesso schema di strumenti\_ambiente.cmd di Agora.
rem
rem Imposta:
rem   GESTYWEB_RADICE  cartella del progetto (quella con angular.json)
rem   GESTYWEB_NG      percorso di ng.js dentro node_modules
rem
rem Gli script sono identici in SandBox e in produzione. L'unica cosa che
rem cambia fra le due macchine sta FUORI dal progetto: se accanto alla
rem cartella del progetto c'e' ambiente-node.cmd, viene richiamato prima di
rem tutto (in SandBox mette in testa al PATH il Node portabile e porta la
rem cache di npm su D:). Se non c'e', si usa il Node che si trova nel PATH.
rem ---------------------------------------------------------------------------

for %%I in ("%~dp0..") do set "GESTYWEB_RADICE=%%~fI"
for %%I in ("%GESTYWEB_RADICE%\..") do set "GESTYWEB_ESTERNA=%%~fI"
set "GESTYWEB_NG=%GESTYWEB_RADICE%\node_modules\@angular\cli\bin\ng.js"

if not exist "%GESTYWEB_RADICE%\angular.json" (
  echo In "%GESTYWEB_RADICE%" non c'e' angular.json: strumenti\ deve stare nella cartella del progetto.
  exit /b 1
)

if exist "%GESTYWEB_ESTERNA%\ambiente-node.cmd" (
  call "%GESTYWEB_ESTERNA%\ambiente-node.cmd" || exit /b 1
)

set "NG_CLI_ANALYTICS=false"
set "NO_UPDATE_NOTIFIER=1"
set "npm_config_update_notifier=false"
set "npm_config_fund=false"

where node >nul 2>nul || (
  echo Node non trovato nel PATH. Installalo, oppure metti accanto alla cartella
  echo del progetto un ambiente-node.cmd che lo aggiunga al PATH.
  exit /b 1
)

rem Versioni ammesse da Angular 22: ^22.22.3, ^24.15.0, >=26 ("engines" di
rem @angular/core), le stesse di Agora.
set "NODE_VERSIONE="
for /f "delims=" %%v in ('node --version') do set "NODE_VERSIONE=%%v"
for /f "tokens=1,2 delims=v." %%a in ("%NODE_VERSIONE%") do (
  set "NODE_MAGGIORE=%%a"
  set "NODE_MINORE=%%b"
)
if not defined NODE_MINORE (
  echo Versione di Node non riconosciuta: "%NODE_VERSIONE%".
  exit /b 1
)
set "NODE_ADATTO=0"
if %NODE_MAGGIORE% GEQ 26 set "NODE_ADATTO=1"
if %NODE_MAGGIORE% EQU 24 if %NODE_MINORE% GEQ 15 set "NODE_ADATTO=1"
if %NODE_MAGGIORE% EQU 22 if %NODE_MINORE% GEQ 22 set "NODE_ADATTO=1"
if "%NODE_ADATTO%"=="0" (
  echo Node %NODE_VERSIONE% non e' adatto ad Angular 22: servono 22.22 o piu', 24.15 o piu', oppure 26.
  exit /b 1
)
echo Node %NODE_VERSIONE% - progetto %GESTYWEB_RADICE%
exit /b 0
