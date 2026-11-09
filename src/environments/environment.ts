export const environment = {
  production: false,
  // zServer di Gesty: 8444 (8443 e' quello di WT), come avvia-con-zserver.cmd.
  // E' il valore predefinito: un config.json accanto a index.html lo sostituisce
  // (core/services/configurazione.ts); il codice legge UrlService.baseUrl
  apiUrl: 'http://localhost:8444/api',
  // Credenziali precompilate nella pagina di accesso, solo in sviluppo:
  // environment.production.ts le lascia nulle e la compilazione di
  // produzione sostituisce questo file con quello
  credenzialiSviluppo: { username: 'luca', password: '123' } as {
    username: string;
    password: string;
  } | null,
};
