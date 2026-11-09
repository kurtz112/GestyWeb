// ─── config.service.ts ───────────────────────────────────────────────────────
// Unico punto di configurazione per header, sidebar e footer.
// Iniettare nei componenti via DI standard: inject(AppConfigService).
// ---------------------------------------------------------------------------

import { Injectable, signal } from '@angular/core';
import { VoceMenu } from '@zng/core/models/menu.models';

// La versione e' quella che zBuilder scrive in package.json a ogni
// compilazione (anno.mese.giorno): un valore solo, mai da aggiornare a mano.
// L'importazione per nome porta nel pacchetto solo "version", non le
// dipendenze.
import { version } from '../../../../package.json';

// ── Tipi ────────────────────────────────────────────────────────────────────

export interface BrandTitle {
  /** Prima parte del titolo (es. "Gesty") */
  part1: string;
  /** Colore CSS della prima parte – accetta qualsiasi valore CSS valido
   *  oppure una variabile CSS, es. 'var(--gesty-primary)'              */
  color1: string;
  /** Seconda parte del titolo (es. "Web") */
  part2: string;
  /** Colore CSS della seconda parte */
  color2: string;
}

export interface AppConfig {
  /** Percorso immagine logo (relativo ad assets/) */
  logoSrc: string;
  /** Testo alternativo del logo */
  logoAlt: string;
  /** Titolo brand a due parti/colori */
  title: BrandTitle;
  /** Versione applicazione mostrata nel footer */
  version: string;
  /** Testo descrittivo nel footer (es. "Gestione Integrata Personale") */
  footerDescription: string;
  /** Testo copyright nel footer (es. "© 2025 Acme Srl") */
  copyright: string;
  /** Voci menu principale nella sidebar */
  menuItems: VoceMenu[];
  /** Voci di servizio in fondo alla sidebar (impostazioni, logout…) */
  serviceItems: VoceMenu[];
}

// ── Configurazione di default (GestyWeb) ────────────────────────────────────

const DEFAULT_CONFIG: AppConfig = {
  logoSrc: 'leaf.svg',
  logoAlt: 'Logo',
  title: {
    part1: 'Gesty',
    color1: 'var(--gesty-primary)',
    part2: 'Web',
    color2: 'var(--gesty-leaf)',
  },
  version,
  footerDescription: 'Gestione Integrata Personale',
  copyright: `© ${new Date().getFullYear()}`,
  menuItems: [
    { text: 'Home', icon: 'home', path: 'home' },
    { text: 'Agenda Personale', icon: 'event', path: 'agenda' },
    { text: 'Incarichi Assegnati', icon: 'contentlayout', path: 'incarichi' },
    { text: 'Timesheet', icon: 'clock', path: 'timesheet' },
    { text: 'Registro Presenze', icon: 'check', path: 'presenze' },
    { text: 'Ore di Recupero', icon: 'revert', path: 'ore-recupero' },
    { text: 'Autorizzazioni Pagamento', icon: 'money', path: 'autorizzazioni' },
    { text: 'Notifiche', icon: 'bell', path: 'notifiche' },
    { text: 'Allegati', icon: 'attach', path: 'allegati' },
    { text: 'Anagrafica', icon: 'user', path: 'anagrafica' },
    { text: 'Dashboard', icon: 'activefolder', path: 'dashboard', soloMetadati: true },
    { text: 'test', icon: 'coffee', path: 'meta', soloMetadati: true },
  ],
  serviceItems: [
    { text: 'Impostazioni', icon: 'preferences', path: 'impostazioni' },
    { text: 'Cambio Password', icon: 'key', path: 'password' },
    { text: 'Logout', icon: 'runner', path: 'logout' },
  ],
};

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private _config = signal<AppConfig>(DEFAULT_CONFIG);

  /**
   * Signal readonly della configurazione corrente.
   * Usato direttamente nei template: configService.config().logoSrc
   */
  readonly config = this._config.asReadonly();

  /**
   * Sovrascrive parzialmente la configurazione a runtime,
   * utile per caricarla da un endpoint o da environment.ts.
   *
   * Esempio:
   *   configService.set({ title: { part1:'ITS', color1:'#0f5', part2:'Academy', color2:'#05f' } });
   */
  set(partial: Partial<AppConfig>): void {
    this._config.update((current) => ({
      ...current,
      ...partial,
      title: { ...current.title, ...(partial.title ?? {}) },
    }));
  }
}
