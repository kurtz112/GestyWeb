// Numero di notifiche non lette dell'utente collegato, per il contatore sulla
// campanella del menu. Una notifica e' non letta se DATA_ORA_LETTURA e' nulla.
//
// zServer non sa filtrare sul valore nullo (il filtro ["CAMPO","=",null] confronta
// con la stringa 'null'), quindi si leggono le ultime notifiche e si contano qui.
// Le notifiche di un utente sono poche; se sono piu' di LIMITE il contatore conta
// solo le piu' recenti.
import { inject, Injectable, signal } from '@angular/core';
import { ZServerService } from '@zng/core/services/zserver.service';

const DATASET = 'Risorsa.Notifiche';
const LIMITE = 500;

@Injectable({ providedIn: 'root' })
export class NotificheNonLetteService {
  private zserver = inject(ZServerService);

  readonly conteggio = signal(0);

  async aggiorna(): Promise<void> {
    try {
      const store = this.zserver.createDataStore(DATASET, 'ID_NOTIFICA');
      const risposta = (await store.load({
        take: LIMITE,
        sort: [{ selector: 'DATA_ORA_NOTIFICA', desc: true }],
      })) as unknown as { data: Record<string, unknown>[] };
      const notifiche = risposta.data ?? [];
      // se la procedura non restituisce DATA_ORA_LETTURA non si sa quali siano lette: nessun contatore
      const conosceLettura = notifiche.length === 0 || 'DATA_ORA_LETTURA' in notifiche[0];
      this.conteggio.set(
        conosceLettura ? notifiche.filter((n) => n['DATA_ORA_LETTURA'] == null).length : 0,
      );
    } catch {
      this.conteggio.set(0);
    }
  }
}
