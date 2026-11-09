// ─── sidebar.component.ts ────────────────────────────────────────────────────

import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AppConfigService } from '@core/services/config.service';
import { NotificheNonLetteService } from '@core/services/notifiche-non-lette.service';
import { SidebarService } from '@core/services/sidebar.service';
import { vociMenuVisibili } from '@zng/core/models/menu.models';
import { AccessoMetadatiService } from '@zng/core/services/accesso-metadati.service';
import { AuthService } from '@zng/core/services/auth.service';
import { DxButtonModule, DxListModule } from 'devextreme-angular';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, DxListModule, DxButtonModule],
  template: `
    <!-- Overlay -->
    <div
      class="sidebar-backdrop"
      [class.visible]="sidebar.isOpen()"
      (click)="sidebar.close()"
    ></div>

    <!-- Pannello -->
    <aside class="sidebar-panel" [class.aperta]="sidebar.isOpen()">
      <!-- Header sidebar -->
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <img [src]="cfg().logoSrc" [alt]="cfg().logoAlt" class="sidebar-logo" />
          <div class="brand-text">
            <span class="brand-part1" [style.color]="cfg().title.color1">{{
              cfg().title.part1
            }}</span
            ><span class="brand-part2" [style.color]="cfg().title.color2">{{
              cfg().title.part2
            }}</span>
          </div>
        </div>
        <dx-button icon="close" stylingMode="text" (onClick)="sidebar.close()"></dx-button>
      </div>

      <!-- Voci principali -->
      <div class="sidebar-scrollable-content">
        <dx-list
          class="menu-list"
          [items]="vociMenu()"
          selectionMode="single"
          keyExpr="path"
          [activeStateEnabled]="false"
          (onItemClick)="naviga($event)"
        >
          <div *dxTemplate="let item of 'item'" class="menu-item">
            <i class="dx-icon-{{ item.icon }}"></i>
            <span>{{ item.text }}</span>
            @if (item.path === 'notifiche' && nonLette.conteggio() > 0) {
              <b class="menu-badge" title="Notifiche non lette">{{
                nonLette.conteggio() > 99 ? '99+' : nonLette.conteggio()
              }}</b>
            }
          </div>
        </dx-list>
      </div>

      <!-- Voci di servizio -->
      <div class="sidebar-service-section">
        <div class="service-divider"></div>
        <dx-list
          class="menu-list service-list"
          [items]="cfg().serviceItems"
          [activeStateEnabled]="false"
          (onItemClick)="naviga($event)"
        >
          <div *dxTemplate="let item of 'item'" class="menu-item service">
            <i class="dx-icon-{{ item.icon }}"></i>
            <span>{{ item.text }}</span>
          </div>
        </dx-list>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 199;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
        &.visible {
          opacity: 1;
          pointer-events: auto;
        }
      }
      .sidebar-panel {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 260px;
        background: var(--gesty-card);
        border-right: 1px solid var(--gesty-border);
        display: flex;
        flex-direction: column;
        z-index: 200;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
        &.aperta {
          transform: translateX(0);
        }
      }
      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px 0 20px;
        height: 70px;
        flex-shrink: 0;
        border-bottom: 1px solid var(--gesty-border);
      }
      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
        font-family: 'Inter', sans-serif;
        letter-spacing: -0.03em;
        line-height: 1;
        img {
          height: 28px;
          width: 28px;
          object-fit: contain;
        }
        .brand-text {
          display: inline;
          font-size: 1.35rem;
        }
        .brand-part1 {
          font-weight: 700;
        }
        .brand-part2 {
          font-weight: 800;
        }
      }
      .sidebar-scrollable-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }
      .sidebar-service-section {
        flex-shrink: 0;
        padding-bottom: 8px;
      }
      .service-divider {
        height: 1px;
        background: var(--gesty-border);
        margin: 4px 16px;
      }
      ::ng-deep .menu-list .dx-list-item {
        border-bottom: none !important;
      }
      ::ng-deep .menu-list .dx-list-item + .dx-list-item {
        border-top: none !important;
      }
      ::ng-deep .menu-list.dx-list {
        border: none !important;
        background: transparent !important;
      }
      /* Contatore delle notifiche non lette, accanto alla voce Notifiche */
      .menu-badge {
        margin-left: auto;
        margin-right: 12px;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: var(--gesty-leaf);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 700;
        line-height: 1;
      }
      .menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 2px 0;
        font-size: 0.88rem;
        font-weight: 500;
        color: var(--gesty-text);
        i {
          font-size: 1.1rem;
          color: var(--gesty-text-muted);
          width: 20px;
          text-align: center;
        }
      }
      ::ng-deep .menu-list .dx-list-item.dx-state-hover {
        background-color: rgba(118, 176, 65, 0.08) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-state-hover .menu-item i {
        color: var(--gesty-leaf) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-state-hover .menu-item span {
        color: var(--gesty-primary) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-state-active {
        background-color: rgba(118, 176, 65, 0.18) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-list-item-selected,
      ::ng-deep .menu-list .dx-list-item.dx-list-item-selected.dx-state-hover {
        background-color: rgba(118, 176, 65, 0.13) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-list-item-selected .menu-item i {
        color: var(--gesty-leaf) !important;
      }
      ::ng-deep .menu-list .dx-list-item.dx-list-item-selected .menu-item span {
        color: var(--gesty-primary) !important;
        font-weight: 600;
      }
      ::ng-deep .menu-list .dx-list-item.dx-state-focused {
        background-color: rgba(118, 176, 65, 0.1) !important;
      }
      ::ng-deep .dx-button.dx-state-focused {
        outline: none !important;
        box-shadow: 0 0 0 2px var(--gesty-leaf) !important;
        border-color: var(--gesty-leaf) !important;
      }
    `,
  ],
})
export class SidebarComponent {
  protected sidebar = inject(SidebarService);
  protected cfg = inject(AppConfigService).config;
  private router = inject(Router);
  private accessoMetadati = inject(AccessoMetadatiService);
  private auth = inject(AuthService);

  // Le voci di sviluppo (Dashboard, prove) compaiono solo a chi ha l'autorizzazione
  // all'editor dei metadati: il menu nasce dopo l'accesso, quindi e' quella dell'utente collegato
  protected vociMenu = computed(() =>
    vociMenuVisibili(this.cfg().menuItems, this.accessoMetadati.abilitato()),
  );

  protected nonLette = inject(NotificheNonLetteService);

  constructor() {
    void this.accessoMetadati.verifica();
    // il menu nasce dopo l'accesso: il numero e' quello dell'utente collegato;
    // si rilegge quando si apre la pagina delle notifiche
    void this.nonLette.aggiorna();
    this.router.events
      .pipe(
        filter(
          (evento) =>
            evento instanceof NavigationEnd && evento.urlAfterRedirects.startsWith('/notifiche'),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.nonLette.aggiorna());
  }

  naviga(e: any): void {
    this.sidebar.close();
    // "logout" non e' una rotta: navigarci portava alla Home (regola **)
    // senza chiudere la sessione
    if (e.itemData.path === 'logout') {
      this.auth.logout();
      return;
    }
    this.router.navigate([e.itemData.path]);
  }
}
