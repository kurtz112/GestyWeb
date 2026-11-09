import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from '@zng/core/guards/auth.guard';
import { metadatiGuard } from '@zng/core/guards/metadati.guard';
import { UrlService } from '@zng/core/services/url.service';
// solo il token: l'editor resta caricato a richiesta
import { ZZ_META_EDITOR_CONFIG } from '@zng/zz/meta-editor/meta-editor.config';

export const routes: Routes = [
  // ── Pagine pubbliche ────────────────────────────────────────────────────────
  {
    // con una sessione ancora valida la guardia riporta alla pagina iniziale
    path: 'login',
    canActivate: [authGuard],
    loadComponent: () => import('@pages/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Pagine riservate: tutte sotto la stessa guardia ─────────────────────────
  // Prima solo dashboard, meta e meta-editor erano protette: le altre pagine si
  // aprivano anche senza accesso e mostravano solo errori 401 del server.
  // Una pagina nuova aggiunta qui sotto e' protetta senza doverlo ricordare.
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('@pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('@pages/agenda/agenda.component').then((m) => m.AgendaComponent),
      },
      {
        path: 'incarichi',
        loadComponent: () =>
          import('@pages/incarichi/incarichi.component').then((m) => m.IncarichiComponent),
      },
      {
        path: 'timesheet',
        loadComponent: () =>
          import('@pages/timesheet/timesheet.component').then((m) => m.TimesheetComponent),
      },
      {
        path: 'presenze',
        loadComponent: () =>
          import('@pages/presenze/presenze.component').then((m) => m.PresenzeComponent),
      },
      {
        path: 'ore-recupero',
        loadComponent: () =>
          import('@pages/ore-recupero/ore-recupero.component').then((m) => m.OreRecuperoComponent),
      },
      {
        path: 'autorizzazioni',
        loadComponent: () =>
          import('@pages/autorizzazioni/autorizzazioni.component').then(
            (m) => m.AutorizzazioniComponent,
          ),
      },
      {
        path: 'allegati',
        loadComponent: () =>
          import('@pages/allegati/allegati.component').then((m) => m.AllegatiComponent),
      },
      {
        path: 'anagrafica',
        loadComponent: () =>
          import('@pages/anagrafica/anagrafica.component').then((m) => m.AnagraficaComponent),
      },
      {
        // Riservata dal 2026-10-30: il cambio password vuole la sessione
        // (POST /auth/password prende l'utente dal token). Prima era pubblica,
        // perche' ci portava il "Password dimenticata?" del login, e aperta
        // senza accesso mostrava un modulo che poteva solo fallire con 401.
        path: 'password',
        loadComponent: () =>
          import('@pages/password/password.component').then((m) => m.PasswordComponent),
      },
      {
        path: 'notifiche',
        loadComponent: () =>
          import('@pages/notifiche/notifiche.component').then((m) => m.NotificheComponent),
      },

      // ── Strumenti di sviluppo: serve anche l'autorizzazione ai metadati ─────
      {
        path: 'dashboard',
        canActivate: [metadatiGuard],
        loadComponent: () =>
          import('@pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'meta',
        canActivate: [metadatiGuard],
        loadComponent: () =>
          import('@pages/metadata-demo/metadata-demo.component').then(
            (m) => m.MetadataDemoComponent,
          ),
      },
      {
        // editor dei metadati BaseWeb (zz/meta-editor, stesso sorgente di Agorà);
        // parametri accettati: tab, dataset, subtab, field (vedi VERSIONE.md)
        path: 'meta-editor',
        canActivate: [metadatiGuard],
        providers: [
          {
            provide: ZZ_META_EDITOR_CONFIG,
            useFactory: () => ({ apiUrl: `${inject(UrlService).baseUrl}/meta` }),
          },
        ],
        loadComponent: () =>
          import('@zng/zz/meta-editor/meta-editor.component').then((m) => m.MetaEditorComponent),
      },
    ],
  },

  // indirizzo sconosciuto: pagina iniziale, che senza accesso porta al login
  { path: '**', redirectTo: '' },
];
