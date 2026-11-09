// Date per le pagine del portale del collaboratore: formato dei filtri verso
// zServer e calcolo dell'anno formativo.

/** 'yyyy-MM-dd' in ora locale: zServer lo converte nel tipo del campo filtrato
 *  (DATE o TIMESTAMP). Un Date serializzato da JSON andrebbe in UTC e, in Italia,
 *  sposterebbe il limite al giorno prima. */
export function formatoIso(data: Date): string {
  const mese = String(data.getMonth() + 1).padStart(2, '0');
  const giorno = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mese}-${giorno}`;
}

/** Inizio del giorno di `data` spostato di `giorni` (anche negativi). */
export function aggiungiGiorni(data: Date, giorni: number): Date {
  const risultato = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  risultato.setDate(risultato.getDate() + giorni);
  return risultato;
}

/** Filtro DevExtreme sul mese di `anno`/`mese` (1-12) per il campo indicato. */
export function filtroMese(campo: string, anno: number, mese: number): unknown[] {
  const primo = new Date(anno, mese - 1, 1);
  const successivo = new Date(anno, mese, 1);
  return [[campo, '>=', formatoIso(primo)], 'and', [campo, '<', formatoIso(successivo)]];
}

// L'anno formativo parte a settembre, come la funzione ANNO_FORMATIVO del
// database: ANNO_FORMATIVO '2025/2026' va da settembre 2025 ad agosto 2026.
// Il dominio ANNO_FORMATIVO e' VARCHAR(9): Number('2025/2026') darebbe NaN,
// quindi l'anno di partenza si legge dalle prime cifre.

/** Anno solare di una riga con ANNO_FORMATIVO ('2025/2026' o 2025) e MESE. */
export function annoSolare(annoFormativo: unknown, mese: number): number {
  const annoInizio = parseInt(String(annoFormativo ?? ''), 10) || 0;
  return mese >= 9 ? annoInizio : annoInizio + 1;
}

/** La riga del mese piu' recente fra quelle con ANNO_FORMATIVO e MESE. */
export function ultimoMese<T extends Record<string, any>>(righe: T[]): T | null {
  const chiave = (riga: T) =>
    annoSolare(riga['ANNO_FORMATIVO'], Number(riga['MESE'] ?? 0)) * 100 + Number(riga['MESE'] ?? 0);
  let ultimo: T | null = null;
  for (const riga of righe) {
    if (!ultimo || chiave(riga) > chiave(ultimo)) ultimo = riga;
  }
  return ultimo;
}
