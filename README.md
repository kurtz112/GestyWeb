# GestyWeb

Portale web di Gesty: Angular 22, DevExtreme 26.1, dati da zServer di Gesty.

## Requisiti

- Node `22.22.3` o successivo della 22, `24.15.0` o successivo della 24, oppure 26 (`engines` in `package.json`).

## Comandi

Gli script stanno in `strumenti\` e si lanciano da qualunque cartella.

| Script | Cosa fa |
|---|---|
| `inizializza.cmd` | Prima messa in funzione: controllo di Node, `npm ci`, compilazione development e production |
| `installa-dipendenze.cmd` | `npm ci` dal file di blocco; da rilanciare quando un rilascio cambia `package.json` o `package-lock.json` |
| `compila.cmd [production\|development]` | `ng build`; uscita in `dist\gestyweb` |
| `pubblica.cmd "<cartella del sito>" [configurazione]` | compila (predefinita `production`) e rispecchia `dist\gestyweb\browser` nella cartella del sito; `web.config` e `config.json` dell'installazione restano; si ferma se la cartella è un sorgente o non è un sito Angular |
| `verifica.cmd` | ESLint su tutto il progetto (`eslint .`, configurazione in `eslint.config.cjs`); `eslint --fix` sistema da solo formattazione e ordine degli import |
| `avvia.cmd [configurazione] [porta]` | `ng serve`, predefiniti development e 4201 |
| `avvia-con-zserver.cmd [configurazione] [porta]` | avvia anche zServer di Gesty |
| `pulisci.cmd [tutto]` | cancella `dist` e `.angular`; con `tutto` anche `node_modules` |
| `genera-chiave-devextreme.cmd` | rigenera la chiave di esecuzione di DevExtreme in `src\devextreme-license.ts`; se lo strumento non trova una chiave valida il file resta com'era |

## Configurazione

**Ogni installazione ha il suo `config.json`**, accanto a `index.html` nella cartella del sito: lo scrive il sistemista partendo da `config.esempio.json`, che il pacchetto contiene, e si cambia senza ricompilare. Le voci:

| Voce | Cosa contiene |
|---|---|
| `apiUrl` | indirizzo di zServer di Gesty: assoluto (`http://server:8444/api`) o relativo al sito (`/api`, dietro il proxy) |

- Se la voce manca, o tutto il file se manca, vale il valore compilato da `src\environments\environment.ts` (sviluppo) o da `environment.production.ts` (`production`, `apiUrl` relativo).
- Un `config.json` scritto male ferma l'avvio e la pagina dice il motivo. Una voce con un nome sconosciuto si ignora e si segnala nella console del browser.
- Il pacchetto non contiene `config.json`: un aggiornamento che sostituisce i file del sito non tocca la configurazione dell'installazione, purché non cancelli quel file.
- Nel codice i valori si leggono solo da `src\app\core\services\configurazione.ts`; l'indirizzo di zServer da `UrlService.baseUrl`, che lo prende da lì. `AppConfigService` (`config.service.ts`) resta l'aspetto dell'interfaccia: marchio, menu, piede di pagina.
- Il file arriva al browser di chiunque apra il sito: niente password o chiavi riservate. Le credenziali precompilate di sviluppo restano compilate in `environment*.ts`.
- La versione mostrata nel piede di pagina è `version` di `package.json`, quella che zBuilder scrive a ogni compilazione.

## Chiave DevExtreme

DevExtreme 26.1 vuole una **chiave di esecuzione** (comincia con `LCPv1`), ricavata dalla chiave DevExpress dell'account registrata sulla macchina (variabile `DevExpress_License`, variabile `DevExpress_LicensePath` o `%AppData%\DevExpress\DevExpress_License.txt`). Senza, o con una chiave sbagliata, compare la fascia "For evaluation purposes only".

- Sta in un file solo, `src\devextreme-license.ts`, che `main.ts` passa a DevExtreme per tutte le configurazioni: gli environment non la contengono.
- Si rigenera con `strumenti\genera-chiave-devextreme.cmd` **a ogni versione maggiore di DevExtreme** (26.2, 27.1...), dopo aver registrato la chiave DevExpress della nuova versione: la chiave di esecuzione porta l'ultima versione ammessa, e con una più nuova la fascia ricompare. Gli aggiornamenti minori (26.1.x) non la cambiano.
- Il file fa parte dei sorgenti, nonostante la riga "Do not commit" scritta dallo strumento: la compilazione non lo rigenera, così una macchina senza chiave DevExpress compila comunque con la chiave giusta.

## Motore zz-*

Griglia, scheda e ricerca dai metadati di zServer: vedi `src\app\core\components\VERSIONE.md`. Il motore è identico a quello di Agorà.
