// src/app/pages/agenda/agenda.component.ts
//
// Agenda personale del collaboratore: lezioni, ore rilevate, riunioni, agenda,
// prenotazioni e inagibilita' delle aule, chiusure delle sedi, presenze,
// assenze e scadenze, dal dataset Risorsa.Agenda (CALENDARIO_AGENDA_PERSONALE).
//
// Si chiede a zServer la finestra attorno al giorno mostrato e la si ricarica
// quando il calendario ne esce. Il periodo va alla procedura come DAL_GIORNO e
// AL_GIORNO (zServer li lega dal rilascio 004 di questo lavoro); il filtro su
// INIZIO resta perche', con uno zServer precedente, la SQL del dataset ripiega
// su un periodo fisso attorno a oggi. Sola lettura: le modifiche si fanno in Gesty.
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { aggiungiGiorni, formatoIso } from '@core/helper/date-portale';
import { ZServerService } from '@zng/core/services/zserver.service';
import { DxSchedulerModule, DxTagBoxModule } from 'devextreme-angular';
import { DxSchedulerTypes } from 'devextreme-angular/ui/scheduler';

const DATASET = 'Risorsa.Agenda';
// giorni caricati prima e dopo la data mostrata: coprono anche la vista mese
const MARGINE_GIORNI = 45;
const LIMITE_EVENTI = 2000;

// dal commento del dominio SCHEDULER_TIPO_EVENTO
const TIPI_EVENTO: Record<string, string> = {
  L: 'Lezioni',
  O: 'Ore rilevate',
  R: 'Riunioni',
  A: 'Agenda personale',
  P: 'Prenotazioni aule',
  I: 'Aule inagibili',
  C: 'Chiusure sedi',
  E: 'Presenze',
  Z: 'Assenze',
  S: 'Scadenze',
  F: 'Attivita fuori sede',
  X: 'Altro',
};

interface EventoAgenda {
  id: number;
  text: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tipo: string;
  colore: string | null;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [DxSchedulerModule, DxTagBoxModule],
  template: `
    <div class="card-gesty">
      <div class="testata">
        <h2 class="title-page">Agenda Personale</h2>
        <dx-tag-box
          class="filtro-tipi"
          [items]="tipiPresenti()"
          displayExpr="testo"
          valueExpr="codice"
          [value]="tipiNascosti()"
          (onValueChanged)="tipiNascosti.set($event.value)"
          placeholder="Mostra tutte le categorie"
          [showSelectionControls]="true"
          applyValueMode="useButtons"
          [maxDisplayedTags]="2"
          stylingMode="filled"
          hint="Categorie da nascondere"
        >
        </dx-tag-box>
      </div>
      @if (errore()) {
        <p class="avviso">{{ errore() }}</p>
      }
      <dx-scheduler
        [dataSource]="eventiVisibili()"
        [views]="['day', 'week', 'month', 'agenda']"
        currentView="week"
        [currentDate]="dataCorrente()"
        [height]="680"
        [startDayHour]="7"
        [endDayHour]="21"
        [firstDayOfWeek]="1"
        [editing]="false"
        [showAllDayPanel]="true"
        (onOptionChanged)="onOpzioneCambiata($event)"
        (onAppointmentRendered)="onEventoDisegnato($event)"
      >
      </dx-scheduler>
    </div>
  `,
  styles: [
    `
      .testata {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .testata .title-page {
        margin: 0;
      }
      .filtro-tipi {
        min-width: 280px;
        max-width: 420px;
        flex: 1;
      }
      .avviso {
        color: var(--gesty-text-muted);
        margin: 0 0 12px;
      }
    `,
  ],
})
export class AgendaComponent implements OnInit {
  private zserver = inject(ZServerService);

  readonly dataCorrente = signal(new Date());
  readonly eventi = signal<EventoAgenda[]>([]);
  readonly tipiNascosti = signal<string[]>([]);
  readonly errore = signal('');

  readonly eventiVisibili = computed(() => {
    const nascosti = new Set(this.tipiNascosti());
    return this.eventi().filter((evento) => !nascosti.has(evento.tipo));
  });

  // solo le categorie che compaiono nel periodo caricato
  readonly tipiPresenti = computed(() => {
    const codici = [...new Set(this.eventi().map((evento) => evento.tipo))];
    return codici
      .map((codice) => ({ codice, testo: TIPI_EVENTO[codice] ?? codice }))
      .sort((primo, secondo) => primo.testo.localeCompare(secondo.testo));
  });

  private finestraDal: Date | null = null;
  private finestraAl: Date | null = null;

  ngOnInit(): void {
    void this.caricaAttorno(this.dataCorrente());
  }

  onOpzioneCambiata(e: DxSchedulerTypes.OptionChangedEvent): void {
    if (e.name !== 'currentDate' || !(e.value instanceof Date)) return;
    this.dataCorrente.set(e.value);
    if (!this.dentroLaFinestra(e.value)) {
      void this.caricaAttorno(e.value);
    }
  }

  // il colore arriva da Gesty come TColor di Delphi (intero BGR)
  onEventoDisegnato(e: DxSchedulerTypes.AppointmentRenderedEvent): void {
    const colore = (e.appointmentData as unknown as EventoAgenda).colore;
    if (colore) {
      e.appointmentElement.style.backgroundColor = colore;
    }
  }

  private dentroLaFinestra(data: Date): boolean {
    if (!this.finestraDal || !this.finestraAl) return false;
    // margine di una settimana: la vista settimana e mese sporgono dal giorno
    const settimana = 7 * 86400000;
    return (
      data.getTime() - settimana >= this.finestraDal.getTime() &&
      data.getTime() + settimana <= this.finestraAl.getTime()
    );
  }

  private async caricaAttorno(data: Date): Promise<void> {
    const dal = aggiungiGiorni(data, -MARGINE_GIORNI);
    const al = aggiungiGiorni(data, MARGINE_GIORNI);
    try {
      const store = this.zserver.createDataStore(DATASET, 'ID', {
        DAL_GIORNO: formatoIso(dal),
        AL_GIORNO: formatoIso(al),
      });
      const risposta = (await store.load({
        take: LIMITE_EVENTI,
        filter: [['INIZIO', '>=', formatoIso(dal)], 'and', ['INIZIO', '<', formatoIso(al)]],
        sort: [{ selector: 'INIZIO', desc: false }],
      })) as unknown as { data: Record<string, any>[] };

      this.eventi.set(
        (risposta.data ?? [])
          .filter((riga) => riga['INIZIO'] instanceof Date)
          .map((riga) => daRiga(riga)),
      );
      this.finestraDal = dal;
      this.finestraAl = al;
      this.errore.set('');
    } catch {
      // il dettaglio lo mostra gia' errorInterceptor
      this.errore.set("Non e stato possibile caricare l'agenda.");
    }
  }
}

function daRiga(riga: Record<string, any>): EventoAgenda {
  const inizio = riga['INIZIO'] as Date;
  const fine =
    riga['FINE'] instanceof Date && riga['FINE'] > inizio
      ? (riga['FINE'] as Date)
      : new Date(inizio.getTime() + 3600000);
  return {
    id: riga['ID'],
    text: riga['TITOLO_EVENTO'] ?? '',
    description: riga['CORPO_EVENTO'] ?? '',
    startDate: inizio,
    endDate: fine,
    tipo: riga['SCHEDULER_TIPO_EVENTO'] ?? 'X',
    colore: coloreDelphi(riga['COLORE']),
  };
}

// TColor: 0x00BBGGRR; i valori negativi sono colori di sistema, senza senso qui
function coloreDelphi(valore: unknown): string | null {
  if (typeof valore !== 'number' || valore < 0) return null;
  const rosso = valore & 0xff;
  const verde = (valore >> 8) & 0xff;
  const blu = (valore >> 16) & 0xff;
  return `rgb(${rosso}, ${verde}, ${blu})`;
}
