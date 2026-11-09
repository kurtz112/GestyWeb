// ─── sidebar.service.ts ──────────────────────────────────────────────────────
// Gestisce lo stato aperto/chiuso della sidebar.
// Persiste il valore tramite UserSettingsService (unica sorgente di verità).
// ---------------------------------------------------------------------------

import { inject, Injectable } from '@angular/core';

import { UserSettingsService } from './user-settings.service';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private settings = inject(UserSettingsService);

  /** Legge lo stato corrente dalla sorgente di verità. */
  isOpen(): boolean {
    return this.settings.state().sidebarAperta;
  }

  /** Alterna aperto/chiuso e persiste. */
  toggle(): void {
    this.settings.update({ sidebarAperta: !this.isOpen() });
  }

  /** Forza apertura. */
  open(): void {
    this.settings.update({ sidebarAperta: true });
  }

  /** Forza chiusura. */
  close(): void {
    this.settings.update({ sidebarAperta: false });
  }
}
