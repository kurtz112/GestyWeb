// ─── header.component.ts ─────────────────────────────────────────────────────

import { Component, computed, inject } from '@angular/core';
import { AppConfigService } from '@core/services/config.service';
import { SidebarService } from '@core/services/sidebar.service';
import { AuthService } from '@zng/core/services/auth.service';
import { TemaService } from '@zng/core/services/tema.service';
import { DxButtonModule, DxToolbarModule } from 'devextreme-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DxToolbarModule, DxButtonModule],
  template: `
    <dx-toolbar class="main-header">
      <dxi-item location="before">
        <dx-button icon="menu" stylingMode="text" (onClick)="sidebar.toggle()"> </dx-button>
      </dxi-item>

      <dxi-item location="before">
        <div class="brand">
          <img [src]="cfg().logoSrc" [alt]="cfg().logoAlt" />
          <div class="logo-text">
            <span [style.color]="cfg().title.color1">{{ cfg().title.part1 }}</span>
            <span [style.color]="cfg().title.color2">{{ cfg().title.part2 }}</span>
          </div>
        </div>
      </dxi-item>

      <dxi-item location="after">
        <dx-button
          [icon]="theme.scuro() ? 'sun' : 'moon'"
          stylingMode="text"
          (onClick)="theme.cambiaTema()"
        >
        </dx-button>
      </dxi-item>

      <dxi-item location="after">
        <div class="user-pill">
          <i class="dx-icon-user"></i>
          <span>{{ nomeUtente() }}</span>
        </div>
      </dxi-item>
    </dx-toolbar>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 0 0 65px;
        z-index: 99;
      }

      .main-header {
        height: 65px !important;
        background-color: var(--gesty-card) !important;
        border-bottom: 1px solid var(--gesty-border) !important;
        padding: 0 10px !important;
        box-shadow: none !important;

        /* FORZA TUTTO SU UNA RIGA ED ELIMINA I WRAP DI DEVEXTREME */
        ::ng-deep {
          .dx-toolbar-items-container {
            height: 100% !important;
            overflow: visible !important; /* Impedisce il salto riga */
          }
          .dx-toolbar-before,
          .dx-toolbar-after,
          .dx-toolbar-center {
            display: flex !important;
            align-items: center !important;
            height: 100% !important;
          }
          .dx-toolbar-item {
            padding: 0 5px !important; /* Riduce lo spazio tra gli elementi per farli stare */
          }
        }
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-top: 5px; /* Spostamento verso il basso richiesto */
        white-space: nowrap; /* Impedisce al titolo di andare a capo */

        img {
          height: 24px;
          width: auto;
        }

        .logo-text {
          font-family: 'Inter', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          line-height: 1;
          display: flex;
        }
      }

      .user-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--gesty-bg);
        padding: 5px 12px;
        border-radius: 99px;
        border: 1px solid var(--gesty-border);
        font-size: 0.8rem;
        white-space: nowrap;
        margin-top: 4px; /* Allineamento visivo */
      }
    `,
  ],
})
export class HeaderComponent {
  protected theme = inject(TemaService);
  protected sidebar = inject(SidebarService);
  private configService = inject(AppConfigService);

  private auth = inject(AuthService);

  protected cfg = this.configService.config;

  // Nome dell'utente collegato, dal token di sessione
  protected nomeUtente = computed(() => {
    const utente = this.auth.currentUser();
    return utente?.displayname || utente?.username || '';
  });
}
