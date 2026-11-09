// src/app/pages/home/home.component.ts
//
// Pagina iniziale del collaboratore: un riquadro per ogni cosa che di solito si
// cerca entrando nel portale, ciascuno con il collegamento alla pagina completa.
// Ogni riquadro carica il suo dataset Risorsa.* per conto proprio: se uno non
// risponde gli altri restano utilizzabili.
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  aggiungiGiorni,
  annoSolare,
  filtroMese,
  formatoIso,
  ultimoMese,
} from '@core/helper/date-portale';
import { NotificheNonLetteService } from '@core/services/notifiche-non-lette.service';
import { AuthService } from '@zng/core/services/auth.service';
import { ZServerService } from '@zng/core/services/zserver.service';

const IMPEGNI_MOSTRATI = 5;
const GIORNI_IMPEGNI = 14;
const INCARICHI_MOSTRATI = 3;

interface Impegno {
  inizio: Date;
  fine: Date | null;
  titolo: string;
}

interface Incarico {
  descrizione: string;
  materia: string;
  fine: Date | null;
  oreResidue: number;
}

interface StatoRiquadro<T> {
  caricamento: boolean;
  errore: boolean;
  dati: T | null;
}

function inAttesa<T>(): StatoRiquadro<T> {
  return { caricamento: true, errore: false, dati: null };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private zserver = inject(ZServerService);
  private auth = inject(AuthService);
  protected nonLette = inject(NotificheNonLetteService);

  readonly oggi = new Date();
  readonly nome = (() => {
    const utente = this.auth.currentUser();
    return utente?.displayname || utente?.username || '';
  })();

  readonly impegni = signal(inAttesa<Impegno[]>());
  readonly oreMese = signal(inAttesa<number>());
  readonly incarichi = signal(inAttesa<{ attivi: number; elenco: Incarico[] }>());
  readonly autorizzazioni = signal(inAttesa<{ daValidare: number; ultimaValidata: Date | null }>());
  readonly saldoRecupero = signal(inAttesa<{ residuo: number; periodo: string }>());

  get saluto(): string {
    const ora = this.oggi.getHours();
    return ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera';
  }

  ngOnInit(): void {
    void this.nonLette.aggiorna();
    void this.carica(this.impegni, () => this.leggiImpegni());
    void this.carica(this.oreMese, () => this.leggiOreMese());
    void this.carica(this.incarichi, () => this.leggiIncarichi());
    void this.carica(this.autorizzazioni, () => this.leggiAutorizzazioni());
    void this.carica(this.saldoRecupero, () => this.leggiSaldoRecupero());
  }

  // ── Caricamento ────────────────────────────────────────────────────────────

  private async carica<T>(
    stato: WritableSignal<StatoRiquadro<T>>,
    lettura: () => Promise<T>,
  ): Promise<void> {
    try {
      stato.set({ caricamento: false, errore: false, dati: await lettura() });
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor
      stato.set({ caricamento: false, errore: true, dati: null });
    }
  }

  private async righe(
    dataset: string,
    chiave: string,
    opzioni: Record<string, unknown>,
  ): Promise<Record<string, any>[]> {
    const risposta = (await this.zserver
      .createDataStore(dataset, chiave)
      .load(opzioni)) as unknown as { data: Record<string, any>[] };
    return risposta.data ?? [];
  }

  private async leggiImpegni(): Promise<Impegno[]> {
    const adesso = new Date();
    const righe = await this.righe('Risorsa.Agenda', 'ID', {
      take: 200,
      filter: [
        ['INIZIO', '>=', formatoIso(adesso)],
        'and',
        ['INIZIO', '<', formatoIso(aggiungiGiorni(adesso, GIORNI_IMPEGNI))],
      ],
      sort: [{ selector: 'INIZIO', desc: false }],
    });
    // le categorie di solo contesto (chiusure, inagibilita', presenze) non sono impegni
    return righe
      .filter((riga) => riga['INIZIO'] instanceof Date && riga['INIZIO'] >= adesso)
      .filter((riga) => !['C', 'I', 'E', 'X'].includes(riga['SCHEDULER_TIPO_EVENTO']))
      .slice(0, IMPEGNI_MOSTRATI)
      .map((riga) => ({
        inizio: riga['INIZIO'],
        fine: riga['FINE'] instanceof Date ? riga['FINE'] : null,
        titolo: riga['TITOLO_EVENTO'] ?? '',
      }));
  }

  private async leggiOreMese(): Promise<number> {
    const righe = await this.righe('Risorsa.Presenze', 'ID_PRESENZA_PERSONALE', {
      take: 1000,
      filter: filtroMese('DATA_PRESENZA', this.oggi.getFullYear(), this.oggi.getMonth() + 1),
    });
    return righe.reduce((somma, riga) => somma + Number(riga['ORE_PRESENZA'] ?? 0), 0);
  }

  private async leggiIncarichi(): Promise<{ attivi: number; elenco: Incarico[] }> {
    const righe = await this.righe('Risorsa.Incarichi', 'ID_INCARICO', { take: 500 });
    const inizioOggi = aggiungiGiorni(this.oggi, 0);
    // attivo = non ancora finito; i piu' vicini alla scadenza per primi
    const attivi = righe
      .filter(
        (riga) =>
          !(riga['DATA_FINE_INCARICO'] instanceof Date) || riga['DATA_FINE_INCARICO'] >= inizioOggi,
      )
      .sort(
        (primo, secondo) =>
          dataOppureMai(primo['DATA_FINE_INCARICO']) - dataOppureMai(secondo['DATA_FINE_INCARICO']),
      );
    return {
      attivi: attivi.length,
      elenco: attivi.slice(0, INCARICHI_MOSTRATI).map((riga) => ({
        descrizione: riga['DESC_CORSO_COMPLETA'] || riga['DESC_COMPLETA_PROGETTO'] || '',
        materia: riga['MATERIA'] ?? '',
        fine: riga['DATA_FINE_INCARICO'] instanceof Date ? riga['DATA_FINE_INCARICO'] : null,
        oreResidue: Number(riga['TOTALE_ORE_RESIDUE'] ?? 0),
      })),
    };
  }

  // STATO_AUTORIZZAZIONE: I = inserita (in attesa di validazione), V = validata, A = annullata
  private async leggiAutorizzazioni(): Promise<{
    daValidare: number;
    ultimaValidata: Date | null;
  }> {
    const righe = await this.righe(
      'Risorsa.AutorizzazioniPagamento',
      'ID_AUTORIZZAZIONE_PAGAMENTO',
      { take: 500 },
    );
    const validate = righe
      .filter(
        (riga) =>
          riga['STATO_AUTORIZZAZIONE'] === 'V' && riga['DATA_AUTORIZZAZIONE'] instanceof Date,
      )
      .map((riga) => riga['DATA_AUTORIZZAZIONE'] as Date)
      .sort((prima, seconda) => seconda.getTime() - prima.getTime());
    return {
      daValidare: righe.filter((riga) => riga['STATO_AUTORIZZAZIONE'] === 'I').length,
      ultimaValidata: validate[0] ?? null,
    };
  }

  private async leggiSaldoRecupero(): Promise<{ residuo: number; periodo: string }> {
    const ultimo = ultimoMese(await this.righe('Risorsa.OreRecupero', 'MESE', { take: 500 }));
    if (!ultimo) return { residuo: 0, periodo: '' };
    return {
      residuo: Number(ultimo['RESIDUO_MESE'] ?? 0),
      periodo: `${ultimo['MESE_STR'] ?? ultimo['MESE']} ${annoSolare(ultimo['ANNO_FORMATIVO'], Number(ultimo['MESE']))}`,
    };
  }
}

// senza data di fine = in fondo all'elenco
function dataOppureMai(valore: unknown): number {
  return valore instanceof Date ? valore.getTime() : Number.MAX_SAFE_INTEGER;
}
