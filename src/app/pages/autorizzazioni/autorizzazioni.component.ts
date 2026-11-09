import { CommonModule, registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { formatoIso } from '@core/helper/date-portale';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZServerService } from '@zng/core/services/zserver.service';
import { DxSelectBoxModule } from 'devextreme-angular';

registerLocaleData(localeIt);

const DATASET = 'Risorsa.AutorizzazioniPagamento';

interface Riepilogo {
  validate: number;
  oreValidate: number;
  compensiValidati: number;
  inAttesa: number;
}

// Autorizzazioni di pagamento del collaboratore, un anno alla volta.
// Il filtro sull'anno va alla griglia come filtro del dataset, quindi zServer lo
// traduce in una WHERE su DATA_AUTORIZZAZIONE; il riepilogo si calcola qui.
// STATO_AUTORIZZAZIONE: I = inserita (in attesa di validazione), V = validata,
// A = annullata. Prima i filtri e il totale erano finti, scritti nel codice.
@Component({
  selector: 'app-autorizzazioni',
  standalone: true,
  imports: [CommonModule, DxSelectBoxModule, ZzDataGridComponent],
  templateUrl: './autorizzazioni.component.html',
  styleUrl: './autorizzazioni.component.scss',
})
export class AutorizzazioniComponent implements OnInit {
  private zserver = inject(ZServerService);

  @ViewChild('zzGrid') grid!: ZzDataGridComponent;

  readonly dataset = DATASET;

  // anno solare in corso e i quattro precedenti
  readonly anni = [0, 1, 2, 3, 4].map((indietro) => new Date().getFullYear() - indietro);
  annoSelezionato = new Date().getFullYear();

  readonly riepilogo = signal<Riepilogo | null>(null);

  ngOnInit(): void {
    void this.aggiornaRiepilogo();
  }

  // la griglia esiste solo dopo i metadati: il filtro si applica al giro dopo
  onMetadataLoaded(): void {
    setTimeout(() => this.applicaFiltro());
  }

  onAnnoCambiato(): void {
    this.applicaFiltro();
    void this.aggiornaRiepilogo();
  }

  private filtroAnno(): unknown[] {
    return [
      ['DATA_AUTORIZZAZIONE', '>=', formatoIso(new Date(this.annoSelezionato, 0, 1))],
      'and',
      ['DATA_AUTORIZZAZIONE', '<', formatoIso(new Date(this.annoSelezionato + 1, 0, 1))],
    ];
  }

  private applicaFiltro(): void {
    this.grid?.instance?.filter(this.filtroAnno());
  }

  private async aggiornaRiepilogo(): Promise<void> {
    try {
      const store = this.zserver.createDataStore(DATASET, 'ID_AUTORIZZAZIONE_PAGAMENTO');
      const risposta = (await store.load({ take: 1000, filter: this.filtroAnno() })) as unknown as {
        data: Record<string, any>[];
      };
      const righe = risposta.data ?? [];
      const validate = righe.filter((riga) => riga['STATO_AUTORIZZAZIONE'] === 'V');
      const somma = (campo: string) =>
        validate.reduce((totale, riga) => totale + Number(riga[campo] ?? 0), 0);

      this.riepilogo.set({
        validate: validate.length,
        oreValidate: somma('TOTALE_ORE_AUTORIZZATE'),
        compensiValidati: somma('TOTALE_COMPENSI_AUTORIZZATI'),
        inAttesa: righe.filter((riga) => riga['STATO_AUTORIZZAZIONE'] === 'I').length,
      });
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor
      this.riepilogo.set(null);
    }
  }
}
