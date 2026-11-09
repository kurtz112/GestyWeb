import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { aggiungiGiorni } from '@core/helper/date-portale';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZServerService } from '@zng/core/services/zserver.service';

const DATASET = 'Risorsa.Incarichi';
const DATASET_PIANI = 'Risorsa.Incarichi_PIP';
const DATASET_SERVIZI = 'Risorsa.Incarichi_PIP_Servizi';

interface Riepilogo {
  inCorso: number;
  oreAttribuite: number;
  oreRilevate: number;
  oreResidue: number;
}

// Incarichi del collaboratore (Risorsa.Incarichi) con il riepilogo delle ore
// degli incarichi in corso e, per gli incarichi su piani personalizzati, il
// dettaglio dei piani (Risorsa.Incarichi_PIP) e dei servizi del piano scelto
// (Risorsa.Incarichi_PIP_Servizi).
//
// Le due procedure del dettaglio filtrano per :ID_INCARICO e
// :ID_PIANO_PERSONALIZZATO, che zServer lega dai parametri della richiesta dal
// rilascio 004 di questo lavoro. La griglia passa a createDataStore l'oggetto
// dei parametri ricevuto con beforeLoad e lo rilegge a ogni caricamento: basta
// cambiarne i valori e chiedere refresh().
@Component({
  selector: 'app-elenco-incarichi',
  standalone: true,
  imports: [CommonModule, ZzDataGridComponent],
  templateUrl: './incarichi.component.html',
  styleUrl: './incarichi.component.scss',
})
export class IncarichiComponent implements OnInit {
  private zserver = inject(ZServerService);

  @ViewChild('gridPiani') gridPiani?: ZzDataGridComponent;
  @ViewChild('gridServizi') gridServizi?: ZzDataGridComponent;

  readonly datasetIncarichi = DATASET;
  readonly datasetPiani = DATASET_PIANI;
  readonly datasetServizi = DATASET_SERVIZI;

  readonly riepilogo = signal<Riepilogo | null>(null);
  readonly incaricoConPiani = signal<Record<string, any> | null>(null);
  readonly pianoScelto = signal<Record<string, any> | null>(null);

  private parametriPiani: Record<string, any> = {};
  private parametriServizi: Record<string, any> = {};

  ngOnInit(): void {
    void this.caricaRiepilogo();
  }

  // ── Dettaglio ──────────────────────────────────────────────────────────────

  onIncaricoCambiato(riga: Record<string, any>): void {
    const conPiani = riga?.['PIANI_PERSONALIZZATI'] === true ? riga : null;
    if (conPiani?.['ID_INCARICO'] === this.incaricoConPiani()?.['ID_INCARICO']) return;

    this.incaricoConPiani.set(conPiani);
    this.pianoScelto.set(null);
    if (!conPiani) return;

    this.parametriPiani['ID_INCARICO'] = conPiani['ID_INCARICO'];
    // la griglia dei piani compare con il @if: se esiste gia' si ricarica
    this.gridPiani?.refresh();
  }

  onPianoCambiato(riga: Record<string, any>): void {
    const piano = riga?.['ID_PIANO_PERSONALIZZATO'] != null ? riga : null;
    if (piano?.['ID_PIANO_PERSONALIZZATO'] === this.pianoScelto()?.['ID_PIANO_PERSONALIZZATO'])
      return;

    this.pianoScelto.set(piano);
    if (!piano) return;

    this.parametriServizi['ID_INCARICO'] = this.incaricoConPiani()?.['ID_INCARICO'];
    this.parametriServizi['ID_PIANO_PERSONALIZZATO'] = piano['ID_PIANO_PERSONALIZZATO'];
    this.gridServizi?.refresh();
  }

  // la griglia conserva l'oggetto: i valori messi qui valgono anche dopo
  onPrimaCaricaPiani(e: { extraParams: Record<string, any> }): void {
    Object.assign(e.extraParams, this.parametriPiani);
    this.parametriPiani = e.extraParams;
  }

  onPrimaCaricaServizi(e: { extraParams: Record<string, any> }): void {
    Object.assign(e.extraParams, this.parametriServizi);
    this.parametriServizi = e.extraParams;
  }

  get titoloIncarico(): string {
    const incarico = this.incaricoConPiani();
    return incarico?.['DESC_CORSO_COMPLETA'] || incarico?.['DESC_COMPLETA_PROGETTO'] || '';
  }

  // ── Riepilogo ──────────────────────────────────────────────────────────────

  private async caricaRiepilogo(): Promise<void> {
    try {
      const store = this.zserver.createDataStore(DATASET, 'ID_INCARICO');
      const risposta = (await store.load({ take: 500 })) as unknown as {
        data: Record<string, any>[];
      };
      const inizioOggi = aggiungiGiorni(new Date(), 0);
      // in corso = senza data di fine o con la fine da oggi in poi
      const inCorso = (risposta.data ?? []).filter(
        (riga) =>
          !(riga['DATA_FINE_INCARICO'] instanceof Date) || riga['DATA_FINE_INCARICO'] >= inizioOggi,
      );
      const somma = (campo: string) =>
        inCorso.reduce((totale, riga) => totale + Number(riga[campo] ?? 0), 0);

      this.riepilogo.set({
        inCorso: inCorso.length,
        oreAttribuite: somma('TOTALE_ORE_ATTRIBUITE'),
        oreRilevate: somma('TOTALE_ORE_RILEVATE'),
        oreResidue: somma('TOTALE_ORE_RESIDUE'),
      });
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor; la griglia resta utilizzabile
      this.riepilogo.set(null);
    }
  }
}
