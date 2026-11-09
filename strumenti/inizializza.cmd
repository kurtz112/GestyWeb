@echo off
rem ---------------------------------------------------------------------------
rem Prima messa in funzione del progetto, su una cartella che ha i sorgenti
rem ma non ancora node_modules. Stesso schema di strumenti\inizializza.cmd
rem di Agora.
rem
rem   inizializza.cmd              alla fine aspetta un tasto (doppio clic)
rem   inizializza.cmd /senzapausa  non aspetta (da un altro script)
rem
rem Passi:
rem   1. controllo di Node (versione adatta ad Angular 22);
rem   2. installa-dipendenze.cmd (npm ci);
rem   3. compilazione development;
rem   4. compilazione production.
rem Si ferma al primo passo che fallisce.
rem ---------------------------------------------------------------------------
setlocal
call "%~dp0_ambiente.cmd" || goto errore

echo.
call "%~dp0installa-dipendenze.cmd" || goto errore
echo.
call "%~dp0compila.cmd" development || goto errore
echo.
call "%~dp0compila.cmd" production || goto errore

echo.
echo Progetto pronto. Per provarlo: strumenti\avvia-con-zserver.cmd
if "%~1"=="" pause
exit /b 0

:errore
echo.
echo Inizializzazione interrotta: guarda il primo errore sopra.
if "%~1"=="" pause
exit /b 1
