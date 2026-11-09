import { Component } from '@angular/core';
import { ZzCambioPasswordComponent } from '@zng/core/accesso/zz-cambio-password.component';

// Il modulo e la chiamata a zServer sono di zNg (zz-cambio-password): qui
// restano il riquadro e i testi di GestyWeb. Prima la pagina diceva "Password
// aggiornata con successo" senza chiamare il server, e "Hai dimenticato la
// password?" annunciava un link che nessuno inviava: zServer di Gesty non ha
// il recupero della password, quindi il pulsante non c'e' piu'.
@Component({
  selector: 'app-password',
  imports: [ZzCambioPasswordComponent],
  template: `
    <div class="gesty-container">
      <div class="password-center-wrapper">
        <div class="card-gesty shadow-lg animated-fade-in">
          <div class="section-header">
            <div class="title-group">
              <i class="dx-icon-key icon-leaf"></i>
              <h3>Sicurezza Account</h3>
            </div>
            <p class="subtitle">
              Cambia la tua password: serve quella attuale. La nuova vale dal prossimo accesso.
            </p>
          </div>

          <zz-cambio-password />
        </div>

        <div class="security-tips">
          <i class="dx-icon-info"></i>
          <span
            >Assicurati di usare una password complessa con numeri e simboli per proteggere i tuoi
            dati su GestyWeb. Se non ricordi quella attuale, rivolgiti al tuo ente.</span
          >
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .password-center-wrapper {
        max-width: 500px;
        margin: 40px auto;
        width: 100%;
      }

      .section-header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--gesty-border);
      }

      .title-group {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
      }

      .title-group h3 {
        margin: 0;
        color: var(--gesty-primary);
        font-size: 1.5rem;
        font-weight: 700;
      }

      .subtitle {
        color: var(--gesty-text-muted);
        font-size: 0.9rem;
        margin: 0;
      }

      .security-tips {
        margin-top: 25px;
        display: flex;
        gap: 12px;
        padding: 15px;
        background: rgba(118, 176, 65, 0.05);
        border-radius: 12px;
        color: var(--gesty-text-muted);
        font-size: 0.85rem;
        line-height: 1.4;
      }
      .security-tips i {
        color: var(--gesty-leaf);
        font-size: 1.2rem;
      }

      .animated-fade-in {
        animation: fadeInUp 0.5s ease-out;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 600px) {
        .password-center-wrapper {
          margin: 10px auto;
          padding: 0 15px;
        }
      }
    `,
  ],
})
export class PasswordComponent {}
