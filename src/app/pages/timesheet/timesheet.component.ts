import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZServerService } from '@zng/core/services/zserver.service';
import notify from 'devextreme/ui/notify';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
} from 'devextreme-angular';

/** Riquadro scelto: decide con che filtro si apre la griglia sotto. */
export type RiquadroTimesheet = 'totali' | 'validate' | 'davalidare';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxFormModule,
    DxButtonModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    DxSelectBoxModule,
    ZzDataGridComponent,
  ],
  templateUrl: './timesheet.component.html',
  styleUrl: './timesheet.component.scss',
})
export class TimesheetComponent implements OnInit {
  @ViewChild('zzGrid') zzGrid!: ZzDataGridComponent;

  private zserver = inject(ZServerService);

  dataset = 'Risorsa.Timesheet';

  attivitaDisponibili = [
    'Sviluppo Modulo Agenda',
    'Analisi Requisiti',
    'Docenza Cyber Security',
    'Coordinamento Project Management',
    'Riunioni di Staff',
    'Tutoring di Gruppo',
  ];

  nuovoDato = {
    data: new Date(),
    ore: 8,
    attivita: '',
  };

  // ── KPI dai rilevamenti dell'utente ────────────────────────────────

  // Riquadro attivo: quello il cui filtro e' applicato alla griglia
  riquadroAttivo = signal<RiquadroTimesheet | null>(null);

  private righe = signal<{ ORE: number; VALIDATA: boolean }[]>([]);

  oreTotali = computed(() => this.somma(() => true));
  oreValidate = computed(() => this.somma((r) => r.VALIDATA === true));
  oreDaValidare = computed(() => this.somma((r) => r.VALIDATA !== true));

  get meseCorrente(): string {
    return new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  ngOnInit(): void {
    void this.caricaRilevamenti();
  }

  private somma(filtro: (riga: { ORE: number; VALIDATA: boolean }) => boolean): number {
    return this.righe()
      .filter(filtro)
      .reduce((totale, riga) => totale + (Number(riga.ORE) || 0), 0);
  }

  // Tutti i rilevamenti dell'utente: il server filtra per sessione, quindi il totale di un riquadro
  // coincide con le righe che la griglia mostra dopo il clic
  private async caricaRilevamenti(): Promise<void> {
    const store = this.zserver.createDataStore(this.dataset, 'ID_RILEVAMENTO_ORE');
    const risposta = (await store.load({ take: 5000 })) as unknown as {
      data: { ORE: number; VALIDATA: boolean }[];
    };
    this.righe.set(risposta.data ?? []);
  }

  // ── Riquadri: un clic filtra la griglia ──────────────────────────────────

  filtra(riquadro: RiquadroTimesheet): void {
    const griglia = this.zzGrid;
    if (!griglia) return;
    // un secondo clic sullo stesso riquadro toglie il filtro
    const attivo = this.riquadroAttivo() === riquadro;
    griglia.clearFilter();
    this.riquadroAttivo.set(attivo ? null : riquadro);
    if (attivo) return;

    if (riquadro === 'validate') griglia.setFilter('VALIDATA', '=', true);
    if (riquadro === 'davalidare') griglia.setFilter('VALIDATA', '=', false);
  }

  // ── Azioni ───────────────────────────────────────────────────────────────

  salva(): void {
    if (!this.nuovoDato.attivita || !this.nuovoDato.data) return;
    // la scheda di inserimento non e' ancora collegata al server: non salva niente
    notify('Inserimento ore non ancora collegato al server', 'warning', 3000);
  }
}
