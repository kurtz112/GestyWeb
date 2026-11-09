import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeIt from '@angular/common/locales/it';
import { ApplicationConfig, ErrorHandler, inject, LOCALE_ID } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '@zng/core/interceptors/auth.interceptor';
import { errorInterceptor } from '@zng/core/interceptors/error.interceptor';
import { fornisciConfigurazioneAccesso } from '@zng/core/services/accesso.config';
import { AccessoMetadatiService } from '@zng/core/services/accesso-metadati.service';
import { RegistroErroriHandler } from '@zng/core/services/registro-errori';
import { fornisciConfigurazioneTema } from '@zng/core/services/tema.service';
import { UrlService } from '@zng/core/services/url.service';
import { ZZ_META_EDITOR_CONFIG } from '@zng/zz/meta-editor/meta-editor.config';
import { MetaEditorService } from '@zng/zz/meta-editor/meta-editor.service';
import { ZzMetaInLocoService } from '@zng/zz/meta-editor/meta-in-loco.service';

import { routes } from './app.routes';

// Date, mesi e numeri delle pipe di Angular in italiano: senza LOCALE_ID la
// pipe date usa en-US ("Tuesday 27 October 2026")
registerLocaleData(localeIt);

// Prima di zNg 1.5.0 il tema stava nelle impostazioni di UserSettingsService:
// chi lo aveva scelto lo ritrova alla prima apertura dopo l'aggiornamento
function temaSalvatoPrima(): 'light' | 'dark' | undefined {
  try {
    const tema = JSON.parse(localStorage.getItem('user_settings_v1') ?? '{}')?.tema;
    return tema === 'light' || tema === 'dark' ? tema : undefined;
  } catch {
    return undefined;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideRouter(routes),
    provideAnimations(), // necessario per DevExtreme
    provideHttpClient(
      withInterceptors([
        authInterceptor, // 1° — inietta token, gestisce 401/refresh/logout
        errorInterceptor, // 2° — trasforma tutti gli altri errori in AppError
      ]),
    ),
    // Editor dei metadati in loco (tasto destro su griglie e schede): il menu
    // compare solo a chi ha l'autorizzazione BASE_WEB_METADATI
    {
      provide: ZZ_META_EDITOR_CONFIG,
      useFactory: () => {
        const accesso = inject(AccessoMetadatiService);
        return {
          apiUrl: `${inject(UrlService).baseUrl}/meta`,
          abilitato: () => accesso.abilitato(),
        };
      },
    },
    MetaEditorService,
    ZzMetaInLocoService,
    // Accesso di zNg: login su /login (predefinito), avviso modale sugli errori
    // di scrittura con il testo predefinito sulla chiave esterna
    fornisciConfigurazioneAccesso({ nomeApplicazione: 'GestyWeb' }),
    // Tema chiaro e scuro di zNg: il tema Generic ha un foglio per tema, che
    // zNg scambia; chi non ha mai scelto segue il sistema operativo
    fornisciConfigurazioneTema({
      chiaveMemoria: 'gestyweb.tema',
      temaIniziale: 'sistema',
      fogli: { light: 'temi/dx.light.css', dark: 'temi/dx.dark.css' },
      temaPrecedente: temaSalvatoPrima,
    }),
    // Errori imprevisti del codice nel registro degli errori: in sviluppo si
    // copiano con un clic o con Ctrl+Maiusc+E (registro-errori.ts di zNg)
    { provide: ErrorHandler, useClass: RegistroErroriHandler },
  ],
};
