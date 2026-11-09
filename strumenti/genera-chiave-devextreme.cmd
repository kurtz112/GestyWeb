@echo off
rem ---------------------------------------------------------------------------
rem Genera la chiave di esecuzione di DevExtreme e la scrive in
rem src\devextreme-license.ts, l'unico file che la contiene: main.ts la passa
rem a config() di DevExtreme qualunque sia la configurazione (development,
rem production...).
rem
rem   genera-chiave-devextreme.cmd
rem
rem Va rilanciato a ogni versione maggiore di DevExtreme (26.2, 27.1...),
rem dopo aver registrato sulla macchina la chiave DevExpress aggiornata: la
rem chiave di esecuzione porta con se' l'ultima versione ammessa dalla chiave
rem dell'account, e con una versione piu' nuova ricompare la fascia
rem "For evaluation purposes only". Gli aggiornamenti minori (26.1.x) non
rem chiedono una chiave nuova.
rem
rem La chiave dell'account la legge lo strumento devextreme-license di
rem DevExtreme, nell'ordine: variabile DevExpress_License, variabile
rem DevExpress_LicensePath, %AppData%\DevExpress\DevExpress_License.txt.
rem
rem Lo strumento esce sempre senza errore, anche quando non trova la chiave
rem (scrive TRIAL) o quando la chiave e' di una versione vecchia: per questo
rem la chiave nuova passa da un file temporaneo e sostituisce quella in src\
rem solo se e' una chiave vera e lo strumento non ha dato avvisi.
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || exit /b 1

set "STRUMENTO=%GESTYWEB_RADICE%\node_modules\devextreme\bin\devextreme-license.js"
if not exist "%STRUMENTO%" (
  echo Manca "%STRUMENTO%": lancia prima installa-dipendenze.cmd
  exit /b 1
)

set "DESTINAZIONE=%GESTYWEB_RADICE%\src\devextreme-license.ts"
set "PROVVISORIO=%TEMP%\gestyweb-devextreme-license-%RANDOM%.ts"
set "AVVISI=%TEMP%\gestyweb-devextreme-license-%RANDOM%.txt"

echo === devextreme-license
node "%STRUMENTO%" --out "%PROVVISORIO%" --force --no-gitignore --cwd "%GESTYWEB_RADICE%" 2>"%AVVISI%"
set "ESITO=%ERRORLEVEL%"
type "%AVVISI%"

if not "%ESITO%"=="0" goto rifiuta
if not exist "%PROVVISORIO%" goto rifiuta
findstr /c:"Warning DX" "%AVVISI%" >nul && goto rifiuta
findstr /c:"licenseKey = 'LCPv1" "%PROVVISORIO%" >nul || goto rifiuta

move /y "%PROVVISORIO%" "%DESTINAZIONE%" >nul || goto rifiuta
del "%AVVISI%" >nul 2>nul
echo Chiave scritta in %DESTINAZIONE%
echo Ricompila e consegna il file insieme ai sorgenti: senza, la fascia di valutazione ricompare.
exit /b 0

:rifiuta
del "%PROVVISORIO%" >nul 2>nul
del "%AVVISI%" >nul 2>nul
echo Chiave NON generata: %DESTINAZIONE% resta com'era.
echo Controlla che la chiave DevExpress registrata sulla macchina sia valida e
echo copra la versione di DevExtreme in node_modules (avvisi qui sopra).
exit /b 1
