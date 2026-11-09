// ─── user-settings.service.ts ────────────────────────────────────────────────
// Unica sorgente di verità per le impostazioni utente persistenti.
// Sostituisce il vecchio "ConfigService" (rinominato per chiarezza).
// Il tema non sta piu' qui: lo gestisce TemaService di zNg con la propria
// chiave (app.config.ts), che alla prima apertura legge la voce `tema` rimasta
// nelle impostazioni salvate prima.
// ---------------------------------------------------------------------------

import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export interface AppSettings {
  _version: number;
  lingua: string;
  sidebarAperta: boolean;
}

const CURRENT_VERSION = 1;
const STORAGE_KEY = 'user_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  _version: CURRENT_VERSION,
  lingua: 'it',
  sidebarAperta: true,
};

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private platformId = inject(PLATFORM_ID);

  readonly state = signal<AppSettings>(this.loadFromStorage());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Persiste automaticamente ogni cambiamento
      effect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      });

      // Sincronizza tra tab aperte
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          this.state.set(JSON.parse(e.newValue));
        }
      });
    }
  }

  /** Aggiorna una o più impostazioni in modo immutabile. */
  update(patch: Partial<AppSettings>): void {
    this.state.update((current) => ({ ...current, ...patch }));
  }

  private loadFromStorage(): AppSettings {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_SETTINGS;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    try {
      const data = JSON.parse(saved);
      if (data._version !== CURRENT_VERSION) return DEFAULT_SETTINGS;
      return data;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}
