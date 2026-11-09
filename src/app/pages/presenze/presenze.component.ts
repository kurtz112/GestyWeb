import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { filtroMese } from '@core/helper/date-portale';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZServerService } from '@zng/core/services/zserver.service';
import { DxButtonModule, DxSelectBoxModule } from 'devextreme-angular';

const DATASET = 'Risorsa.Presenze';
const LIMITE_RIGHE_MESE = 1000;

interface Riepilogo {
  oreTotali: number;
  giorniPresenza: number;
  mediaOreGiorno: number;
}

// Registro presenze del collaboratore (Risorsa.Presenze), un mese alla volta.
// Il filtro sul mese va alla griglia come filtro del dataset (instance.filter),
// quindi zServer lo traduce in una WHERE su DATA_PRESENZA; il riepilogo in testa
// si calcola qui sulle stesse righe.
@Component({
  selector: 'app-presenze',
  standalone: true,
  imports: [CommonModule, DxSelectBoxModule, DxButtonModule, ZzDataGridComponent],
  templateUrl: './presenze.component.html',
  styleUrl: './presenze.component.scss',
})
export class PresenzeComponent implements OnInit {
  private zserver = inject(ZServerService);

  @ViewChild('gridPresenze') gridPresenze!: ZzDataGridComponent;

  // ── dataset ──────────────────────────────────────────────────────────────

  dataset = DATASET;

  // ── Filtri ──────────────────────────────────────────────────────────────

  // anno solare in corso e i due precedenti
  anni = [0, 1, 2].map((indietro) => new Date().getFullYear() - indietro);
  selectedAnno = new Date().getFullYear();

  mesi = [
    { id: 1, nome: 'Gennaio' },
    { id: 2, nome: 'Febbraio' },
    { id: 3, nome: 'Marzo' },
    { id: 4, nome: 'Aprile' },
    { id: 5, nome: 'Maggio' },
    { id: 6, nome: 'Giugno' },
    { id: 7, nome: 'Luglio' },
    { id: 8, nome: 'Agosto' },
    { id: 9, nome: 'Settembre' },
    { id: 10, nome: 'Ottobre' },
    { id: 11, nome: 'Novembre' },
    { id: 12, nome: 'Dicembre' },
  ];
  selectedMese = new Date().getMonth() + 1;

  // ── Riepilogo del mese ──────────────────────────────────────────────────

  readonly riepilogo = signal<Riepilogo | null>(null);

  ngOnInit(): void {
    void this._aggiornaRiepilogo();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTI
  // ═══════════════════════════════════════════════════════════════════════════

  // la griglia esiste solo dopo i metadati: il filtro si applica al giro dopo
  onMetadataLoaded(): void {
    setTimeout(() => this._applicaFiltro());
  }

  onFilterChanged(): void {
    this._applicaFiltro();
    void this._aggiornaRiepilogo();
  }

  exportExcel(): void {
    this.gridPresenze?.exportExcel();
  }

  get titoloMese(): string {
    const mese = this.mesi.find((voce) => voce.id === this.selectedMese)?.nome ?? '';
    return `${mese} ${this.selectedAnno}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE
  // ═══════════════════════════════════════════════════════════════════════════

  private _filtroMese(): unknown[] {
    return filtroMese('DATA_PRESENZA', this.selectedAnno, this.selectedMese);
  }

  private _applicaFiltro(): void {
    this.gridPresenze?.instance?.filter(this._filtroMese());
  }

  private async _aggiornaRiepilogo(): Promise<void> {
    try {
      const store = this.zserver.createDataStore(DATASET, 'ID_PRESENZA_PERSONALE');
      const risposta = (await store.load({
        take: LIMITE_RIGHE_MESE,
        filter: this._filtroMese(),
      })) as unknown as { data: Record<string, any>[] };
      const righe = risposta.data ?? [];

      const oreTotali = righe.reduce((somma, riga) => somma + Number(riga['ORE_PRESENZA'] ?? 0), 0);
      const giorni = new Set(
        righe
          .map((riga) => riga['DATA_PRESENZA'])
          .filter((data): data is Date => data instanceof Date)
          .map((data) => data.toDateString()),
      ).size;

      this.riepilogo.set({
        oreTotali,
        giorniPresenza: giorni,
        mediaOreGiorno: giorni > 0 ? oreTotali / giorni : 0,
      });
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor
      this.riepilogo.set(null);
    }
  }
}
