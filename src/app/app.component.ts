// ─── app.component.ts ────────────────────────────────────────────────────────

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '@core/layout/header/header.component';
import { SidebarComponent } from '@core/layout/sidebar/sidebar.component';
import { AppConfigService } from '@core/services/config.service';
import { ZzMetaInLocoComponent } from '@zng/zz/meta-editor/meta-in-loco.component';
import { filter, map, startWith } from 'rxjs/operators';

/** Route che NON devono mostrare header, sidebar e footer. */
const PUBLIC_ROUTES = ['login', 'password'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent, SidebarComponent, ZzMetaInLocoComponent],
  template: `
    <div class="gesty-app-wrapper">
      @if (showLayout()) {
        <app-header></app-header>
        <app-sidebar></app-sidebar>
      }

      <!-- finestre dell'editor dei metadati in loco (menu della scheda, domande, editor completo) -->
      <zz-meta-in-loco />

      <main class="main-content-scroll" [class.no-layout]="!showLayout()">
        <router-outlet></router-outlet>
      </main>

      @if (showLayout()) {
        <footer class="gesty-footer">
          <div class="info">
            <strong>{{ cfg().title.part1 }}{{ cfg().title.part2 }} {{ cfg().version }}</strong>
            &bull;
            {{ cfg().footerDescription }}
          </div>
          <div class="links">Assistenza &bull; Privacy &bull; {{ cfg().copyright }}</div>
        </footer>
      }
    </div>
  `,
  styles: [
    `
      .gesty-app-wrapper {
        display: flex;
        flex-direction: column;
        /* width 100% e non 100vw: 100vw conta anche la barra di scorrimento verticale e fa comparire quella orizzontale */
        height: 100vh;
        width: 100%;
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      .main-content-scroll {
        flex: 1;
        overflow-y: auto;
        background-color: var(--gesty-bg);
      }
      /* Quando non c'è layout (login/password) la main occupa tutta l'altezza */
      .main-content-scroll.no-layout {
        height: 100vh;
      }
      .gesty-footer {
        flex: 0 0 45px;
        background-color: var(--gesty-card);
        border-top: 1px solid var(--gesty-border);
        padding: 0 25px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        color: var(--gesty-text-muted);
      }
    `,
  ],
})
export class AppComponent {
  protected cfg = inject(AppConfigService).config;

  private router = inject(Router);

  /**
   * Signal booleano: true se la route corrente NON è pubblica.
   * Aggiornato ad ogni NavigationEnd tramite toSignal().
   */
  protected showLayout = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: NavigationEnd) => {
        const segment = e.urlAfterRedirects.replace('/', '').split('?')[0];
        return !PUBLIC_ROUTES.includes(segment);
      }),
      startWith(!PUBLIC_ROUTES.includes(this.router.url.replace('/', '').split('?')[0])),
    ),
    { initialValue: false },
  );
}
