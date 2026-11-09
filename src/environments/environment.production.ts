export const environment = {
  production: true,
  // Valore predefinito, relativo: passa sempre per Nginx. Un config.json
  // accanto a index.html lo sostituisce (core/services/configurazione.ts)
  apiUrl: '/api',
  // In produzione la pagina di accesso parte vuota
  credenzialiSviluppo: null as { username: string; password: string } | null,
};
