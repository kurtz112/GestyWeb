// pagine/anagrafica/anagrafica.component.ts
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZzFormComponent } from '@zng/core/components/zz-form/zz-form.component';
import { AuthService } from '@zng/core/services/auth.service';
import { DxFormModule } from 'devextreme-angular';

@Component({
  selector: 'app-anagrafica',
  standalone: true,
  imports: [CommonModule, DxFormModule, ZzFormComponent, ZzDataGridComponent],
  templateUrl: './anagrafica.component.html',
  styleUrl: './anagrafica.component.scss',
})
export class AnagraficaComponent implements AfterViewInit {
  @ViewChild('zzForm') zzForm: any;

  datasetScheda = 'Risorsa.SchedaPersonale';
  datasetInquadramenti = 'Risorsa.SchedaPersonaleInquadramenti';

  // DATASET
  // Risorsa.Agenda
  // Risorsa.Allegati
  // Risorsa.AutorizzazioniPagamento
  // Risorsa.Incarichi
  // Risorsa.Incarichi_PIP
  // Risorsa.Incarichi_PIP_Servizi
  // Risorsa.Notifiche
  // Risorsa.OreRecupero
  // Risorsa.Presenze
  // Risorsa.SchedaPersonale
  // Risorsa.SchedaPersonaleInquadramenti
  // Risorsa.Timesheet

  private auth = inject(AuthService);

  // Scheda dell'utente collegato: la riempie zz-form quando legge Risorsa.SchedaPersonale
  scheda = signal<Record<string, any>>({});

  // Nome e cognome vengono dalla scheda; finche' non e' arrivata, dal nome della sessione
  nomeCompleto = computed(() => {
    const dati = this.scheda();
    const daScheda = [dati['NOME'], dati['COGNOME']].filter(Boolean).join(' ');
    return daScheda || this.auth.currentUser()?.displayname || '';
  });

  codicePersonale = computed(() => this.scheda()['ID_PERSONALE'] ?? '');

  iniziali = computed(() =>
    this.nomeCompleto()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join(''),
  );

  ngAfterViewInit() {
    this.zzForm.open('view');
  }

  setupFiltri(ev: { dataset: string; extraParams: any }) {
    // Questi verranno aggiunti alla query string della GET
    ev.extraParams['annoRiferimento'] = 2024;
    ev.extraParams['soloConfermati'] = true;
  }
}
