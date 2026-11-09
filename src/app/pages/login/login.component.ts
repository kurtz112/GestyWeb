import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService } from '@core/services/config.service';
import { environment } from '@env/environment';
import { AuthService } from '@zng/core/services/auth.service';
import { TemaService } from '@zng/core/services/tema.service';
import notify from 'devextreme/ui/notify';
// Import necessari per DevExtreme
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxFormModule,
  DxLoadIndicatorModule,
  DxTextBoxModule,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  // Aggiunto DxLoadIndicatorModule agli imports
  imports: [
    DxFormModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxLoadIndicatorModule,
  ],
  template: `
    <div class="login-wrapper">
      <div class="theme-toggle">
        <dx-button
          [icon]="themeService.scuro() ? 'sun' : 'moon'"
          stylingMode="text"
          (onClick)="themeService.cambiaTema()"
        >
        </dx-button>
      </div>

      <div class="login-container shadow-lg">
        <div class="brand-side">
          <div class="brand-content">
            <img src="leaf.svg" class="floating-leaf" alt="Logo" />
            <h1>Gesty<span>Web</span></h1>
            <p>Benvenuto nel portale gestionale integrato per il personale.</p>
          </div>
          <div class="brand-footer">
            v{{ configService.config().version }} • Progettato per l'efficienza
          </div>
        </div>

        <div class="form-side">
          <div class="form-header">
            <h2>Accedi al portale</h2>
            <p>Inserisci le tue credenziali aziendali</p>
          </div>

          <dx-validation-group #validationGroup>
            <dx-form [formData]="loginData" labelLocation="top" [showColonAfterLabel]="false">
              <dxi-item dataField="username" helpText="Inserisci il tuo nome utente">
                <label text="Username"></label>
                <dx-text-box
                  [(value)]="loginData.username"
                  stylingMode="filled"
                  placeholder="Username"
                  height="45"
                >
                  <dx-validator>
                    <dxi-validation-rule
                      type="required"
                      message="L'username è obbligatorio"
                    ></dxi-validation-rule>
                  </dx-validator>
                </dx-text-box>
              </dxi-item>

              <dxi-item dataField="password">
                <label text="Password"></label>
                <dx-text-box
                  [(value)]="loginData.password"
                  mode="password"
                  stylingMode="filled"
                  placeholder="********"
                  height="45"
                >
                  <dx-validator>
                    <dxi-validation-rule
                      type="required"
                      message="La password è obbligatoria"
                    ></dxi-validation-rule>
                  </dx-validator>
                </dx-text-box>
              </dxi-item>

              <dxi-item itemType="group" colCount="2">
                <dxi-item
                  dataField="ricordami"
                  editorType="dxCheckBox"
                  [editorOptions]="{ text: 'Resta collegato' }"
                >
                </dxi-item>
                <dxi-item>
                  <div class="forgot-link" (click)="recuperaPassword()">Password dimenticata?</div>
                </dxi-item>
              </dxi-item>
            </dx-form>

            <div class="login-action">
              <dx-button
                type="default"
                width="100%"
                height="50"
                class="btn-login"
                (onClick)="onLogin($event)"
              >
                <div *dxTemplate="let data of 'content'">
                  @if (isLoading()) {
                    <dx-load-indicator
                      [width]="24"
                      [height]="24"
                      [visible]="true"
                    ></dx-load-indicator>
                  } @else {
                    <span>Entra nel sistema</span>
                  }
                </div>
              </dx-button>
            </div>
          </dx-validation-group>

          <div class="login-footer">
            Non hai le credenziali? <span class="contact-support">Contatta il tuo ente</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ... i tuoi stili esistenti ... */
      .login-action ::ng-deep .dx-button-content {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      /* Aggiungi questo per centrare il load indicator nel bottone */
      dx-load-indicator {
        filter: brightness(0) invert(1);
      }

      /* Copia qui i restanti stili che avevi prima */
      .login-wrapper {
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--gesty-bg);
        position: relative;
      }
      .theme-toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
      }
      .login-container {
        display: flex;
        width: 900px;
        height: 600px;
        background: var(--gesty-card);
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid var(--gesty-border);
      }
      .brand-side {
        flex: 1;
        background: linear-gradient(135deg, var(--gesty-primary) 0%, #1a3617 100%);
        padding: 60px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: white;
      }
      .floating-leaf {
        width: 80px;
        filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2));
        animation: float 6s ease-in-out infinite;
      }
      .brand-content h1 {
        font-size: 3rem;
        margin: 20px 0;
        font-weight: 800;
        letter-spacing: -0.04em;
      }
      .brand-content h1 span {
        color: var(--gesty-leaf);
      }
      .brand-content p {
        font-size: 1.1rem;
        opacity: 0.8;
        line-height: 1.6;
      }
      .brand-footer {
        font-size: 0.8rem;
        opacity: 0.5;
      }
      .form-side {
        flex: 1.2;
        padding: 60px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .form-header {
        margin-bottom: 40px;
      }
      .form-header h2 {
        font-size: 1.8rem;
        margin: 0;
        color: var(--gesty-text);
        font-weight: 700;
      }
      .form-header p {
        color: var(--gesty-text-muted);
        margin-top: 8px;
      }
      .forgot-link {
        text-align: right;
        color: var(--gesty-leaf);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
      }
      .forgot-link:hover {
        color: var(--gesty-primary);
        text-decoration: underline;
      }
      .login-action {
        margin-top: 30px;
      }
      .btn-login {
        background-color: var(--gesty-primary) !important;
        font-weight: 700;
        border-radius: 12px !important;
      }
      .login-footer {
        margin-top: 40px;
        text-align: center;
        font-size: 0.9rem;
        color: var(--gesty-text-muted);
      }
      .contact-support {
        color: var(--gesty-primary);
        font-weight: 600;
        cursor: pointer;
      }
      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-15px);
        }
      }
      @media (max-width: 900px) {
        .login-container {
          width: 100%;
          height: 100vh;
          border-radius: 0;
          flex-direction: column;
        }
        .brand-side {
          display: none;
        }
        .form-side {
          padding: 40px 20px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected themeService = inject(TemaService);
  // versione da package.json, la stessa del footer dell'applicazione
  protected configService = inject(AppConfigService);

  // precompilate solo nella compilazione di sviluppo (environment.ts)
  loginData = {
    username: environment.credenzialiSviluppo?.username ?? '',
    password: environment.credenzialiSviluppo?.password ?? '',
    ricordami: false,
  };

  isLoading = signal(false);

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      notify('La sessione è scaduta. Effettua nuovamente il login.', 'warning', 4000);
    }
  }

  onLogin(e: any): void {
    // Recupera il risultato della validazione
    const result = e.validationGroup.validate();

    if (!result.isValid) {
      notify('Controlla i dati inseriti', 'error', 2000);
      return;
    }

    this.isLoading.set(true);

    this.auth.login(this.loginData.username, this.loginData.password).subscribe({
      next: () => {
        notify('Accesso eseguito con successo', 'success', 2000);
        // la pagina iniziale la decide la rotta vuota in app.routes.ts
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        let msg = 'Errore durante il login';

        if (err.status === 401) msg = 'Credenziali non valide';
        else if (err.status === 0) msg = 'Server non raggiungibile';
        else if (err.error?.message) msg = err.error.message;

        notify(msg, 'error', 4000);
      },
    });
  }

  // zServer di Gesty non ha il recupero della password: la nuova la assegna
  // l'ente. Prima il link apriva /password, che e' il cambio da collegati.
  recuperaPassword() {
    notify(
      'Per recuperare la password rivolgiti al tuo ente: il portale non la invia per posta.',
      'info',
      5000,
    );
  }
}
