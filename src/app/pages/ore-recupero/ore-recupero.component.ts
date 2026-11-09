// src/app/pages/ore-recupero/ore-recupero.component.ts
//
// Ore di recupero del collaboratore, mese per mese (Risorsa.OreRecupero, dalla
// tabella PERSONALE_ORE_RECUPERO_MENSILE). In testa il saldo dell'ultimo mese
// calcolato, sotto la griglia completa guidata dai metadati del dataset.
import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { annoSolare, ultimoMese } from '@core/helper/date-portale';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZServerService } from '@zng/core/services/zserver.service';

const DATASET = 'Risorsa.OreRecupero';

interface Saldo {
  periodo: string;
  residuo: number;
  usufruite: number;
  oltre36Autorizzate: number;
}

@Component({
  selector: 'app-ore-recupero',
  standalone: true,
  imports: [DecimalPipe, ZzDataGridComponent],
  template: `
    <div class="gesty-container">
      <div class="stats-ribbon">
        <div class="stat-card">
          <span class="stat-label">Saldo ore di recupero</span>
          <span class="stat-value">{{ saldo() ? (saldo()!.residuo | number: '1.0-2') : '—' }}</span>
          @if (saldo()) {
            <span class="stat-nota">a fine {{ saldo()!.periodo }}</span>
          }
        </div>
        <div class="stat-card">
          <span class="stat-label">Usufruite nel mese</span>
          <span class="stat-value">{{
            saldo() ? (saldo()!.usufruite | number: '1.0-2') : '—'
          }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Oltre le 36 ore, autorizzate</span>
          <span class="stat-value">{{
            saldo() ? (saldo()!.oltre36Autorizzate | number: '1.0-2') : '—'
          }}</span>
        </div>
      </div>

      <div class="card-gesty">
        <div class="title-group">
          <i class="dx-icon-clock icon-leaf"></i>
          <h3>Ore di recupero per mese</h3>
        </div>
        <zz-data-grid [dataset]="dataset" [height]="520"></zz-data-grid>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-ribbon {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      .stat-card {
        flex: 1;
        min-width: 180px;
        background: var(--gesty-card);
        padding: 20px;
        border-radius: 12px;
        box-shadow: var(--gesty-shadow);
        border: 1px solid var(--gesty-border);
        text-align: center;
      }
      .stat-label {
        display: block;
        font-size: 0.8rem;
        color: var(--gesty-text-muted);
        margin-bottom: 5px;
      }
      .stat-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--gesty-primary);
      }
      .stat-nota {
        display: block;
        font-size: 0.75rem;
        color: var(--gesty-text-muted);
        margin-top: 4px;
      }
      .title-group {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .title-group h3 {
        margin: 0;
      }
    `,
  ],
})
export class OreRecuperoComponent implements OnInit {
  private zserver = inject(ZServerService);

  readonly dataset = DATASET;
  readonly saldo = signal<Saldo | null>(null);

  ngOnInit(): void {
    void this.caricaSaldo();
  }

  private async caricaSaldo(): Promise<void> {
    try {
      const store = this.zserver.createDataStore(DATASET, 'MESE');
      const risposta = (await store.load({ take: 500 })) as unknown as {
        data: Record<string, any>[];
      };
      const ultimo = ultimoMese(risposta.data ?? []);
      this.saldo.set(
        ultimo
          ? {
              periodo: `${ultimo['MESE_STR'] ?? ultimo['MESE']} ${annoSolare(ultimo['ANNO_FORMATIVO'], Number(ultimo['MESE']))}`,
              residuo: Number(ultimo['RESIDUO_MESE'] ?? 0),
              usufruite: Number(ultimo['ORE_RECUPERO_USUFRUITE'] ?? 0),
              oltre36Autorizzate: Number(ultimo['ORE_OLTRE_36_ORE_AUTORIZZATE'] ?? 0),
            }
          : null,
      );
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor; la griglia resta utilizzabile
      this.saldo.set(null);
    }
  }
}
