//TODO Interfacce temporanee da eliminare

export interface Incarico {
  id: number;
  titolo: string;
  descrizione: string;
  scadenza: Date;
  stato: 'Assegnato' | 'In Corso' | 'Completato';
  priorita: number;
}

export interface Appuntamento {
  id: number;
  testo: string;
  inizio: Date;
  fine: Date;
  descrizione?: string;
}

export interface Timesheet {
  id: number;
  data: Date;
  ore: number;
  attivita: string;
  approvato: boolean;
}

export interface Ente {
  id: number;
  nome: string;
}
export interface AnnoFormativo {
  id: number;
  label: string;
}

export interface Servizio {
  id: number;
  descrizione: string;
  orePreviste: number;
  stato: string;
}

export interface PianoPersonalizzato {
  id: number;
  titolo: string;
  servizi: Servizio[];
}

export interface IncaricoEsteso {
  id: number;
  titolo: string;
  enteId: number;
  annoId: number;
  piani: PianoPersonalizzato[];
}

export interface Autorizzazione {
  id: string;
  protocollo: string;
  dataEmissione: Date;
  descrizioneIncarico: string;
  importo: number;
  stato: 'In Elaborazione' | 'Autorizzato' | 'Pagato';
  nomeFile: string;
}

export interface Presenza {
  data: Date;
  entrata: string;
  uscita: string;
  pausa: string;
  oreTotali: number;
  tipo: 'Lavoro' | 'Ferie' | 'Malattia' | 'Permesso';
  note?: string;
}
