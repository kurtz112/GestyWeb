// pagine/notifiche/notifiche.component.ts
//
// Notifiche del collaboratore (Risorsa.Notifiche, procedura WEB_RISORSA_NOTIFICHE).
// Aprire una notifica la segna come letta; "Segna tutte come lette" fa lo stesso
// per tutte. Entrambe passano dal PUT del dataset, che esegue
// WEB_RISORSA_NOTIFICA_LETTA con la chiave (-1 = tutte): la procedura tocca
// solo le notifiche dell'utente collegato. Dopo ogni lettura si aggiorna il
// contatore della barra laterale.
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NotificheNonLetteService } from '@core/services/notifiche-non-lette.service';
import { ZServerService } from '@zng/core/services/zserver.service';
import { DxButtonModule, DxSwitchModule } from 'devextreme-angular';

const DATASET = 'Risorsa.Notifiche';
const CHIAVE = 'ID_NOTIFICA';
const TUTTE = -1;
const LIMITE = 500;

interface Notifica {
  id: number;
  oggetto: string;
  tipo: string;
  mittente: string;
  messaggio: string;
  data: Date | null;
  letta: boolean;
}

@Component({
  selector: 'app-notifiche',
  standalone: true,
  imports: [CommonModule, DxButtonModule, DxSwitchModule],
  templateUrl: './notifiche.component.html',
  styleUrl: './notifiche.component.scss',
})
export class NotificheComponent implements OnInit {
  private zserver = inject(ZServerService);
  private nonLette = inject(NotificheNonLetteService);
  private store = this.zserver.createDataStore(DATASET, CHIAVE);

  readonly notifiche = signal<Notifica[]>([]);
  readonly caricamento = signal(true);
  readonly errore = signal(false);
  readonly soloDaLeggere = signal(false);
  readonly aperta = signal<number | null>(null);

  readonly daLeggere = computed(
    () => this.notifiche().filter((notifica) => !notifica.letta).length,
  );
  readonly visibili = computed(() =>
    this.soloDaLeggere()
      ? this.notifiche().filter((notifica) => !notifica.letta)
      : this.notifiche(),
  );

  ngOnInit(): void {
    void this.carica();
  }

  async apri(notifica: Notifica): Promise<void> {
    this.aperta.set(this.aperta() === notifica.id ? null : notifica.id);
    if (!notifica.letta) {
      await this.segnaLette(notifica.id);
    }
  }

  async segnaTutte(): Promise<void> {
    await this.segnaLette(TUTTE);
  }

  private async segnaLette(id: number): Promise<void> {
    try {
      await this.store.update(id, {});
      this.notifiche.update((elenco) =>
        elenco.map((notifica) =>
          id === TUTTE || notifica.id === id ? { ...notifica, letta: true } : notifica,
        ),
      );
      void this.nonLette.aggiorna();
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor; la notifica resta da leggere
    }
  }

  private async carica(): Promise<void> {
    try {
      const risposta = (await this.store.load({
        take: LIMITE,
        sort: [{ selector: 'DATA_ORA_NOTIFICA', desc: true }],
      })) as unknown as { data: Record<string, any>[] };

      this.notifiche.set(
        (risposta.data ?? []).map((riga) => ({
          id: riga['ID_NOTIFICA'],
          oggetto: riga['OGGETTO'] || '(senza oggetto)',
          tipo: riga['NOTIFICA'] ?? '',
          mittente: riga['NOMINATIVO_MITTENTE'] ?? '',
          messaggio: testoDaBlob(riga['MESSAGGIO']),
          data: riga['DATA_ORA_NOTIFICA'] instanceof Date ? riga['DATA_ORA_NOTIFICA'] : null,
          letta: riga['DATA_ORA_LETTURA'] != null,
        })),
      );
      this.errore.set(false);
    } catch {
      this.errore.set(true);
    } finally {
      this.caricamento.set(false);
    }
  }
}

// zServer manda i campi BLOB in Base64 (encodeBlobs): qui si torna al testo
// UTF-8. Se il valore non e' Base64 valido si mostra cosi' com'e'.
function testoDaBlob(valore: unknown): string {
  if (typeof valore !== 'string' || valore === '') return '';
  try {
    const byte = Uint8Array.from(atob(valore), (carattere) => carattere.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(byte);
  } catch {
    return valore;
  }
}
