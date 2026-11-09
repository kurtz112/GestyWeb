/**
 * form-focus-tracker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce il tracciamento del campo focalizzato all'interno di un dx-form.
 *
 * Viene usato come `ItemPostProcessor` in `buildFormItems`: per ogni item
 * generato, inietta gli handler necessari negli editorOptions in modo che
 * quando l'utente entra in un campo, `FormFocusTracker` aggiorni il proprio
 * stato interno.
 *
 * Nessuna dipendenza da Angular o DevExtreme (importa solo i tipi).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FieldMetadata } from '@zng/core/models/metadata.models';

// ─── Interfaccia pubblica del campo focalizzato ──────────────────────────────

export interface FocusedFieldInfo {
  dataField: string;
  caption: string;
  colSpan: number;
  visible?: boolean;
  readOnly: boolean;
  required: boolean;
  lineBreak: boolean;
  cardIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export class FormFocusTracker {
  /** Nome del campo attualmente focalizzato (stringa vuota = nessuno) */
  get focusedField(): string {
    return this._focusedField;
  }
  private _focusedField = '';

  /** Snapshot del campo focalizzato (null = nessun campo selezionato) */
  get info(): FocusedFieldInfo | null {
    return this._info;
  }
  private _info: FocusedFieldInfo | null = null;

  // ─── API pubblica ────────────────────────────────────────────────────────

  /** Resetta lo stato (da chiamare su reload dei metadati) */
  clear(): void {
    this._focusedField = '';
    this._info = null;
  }

  /**
   * Forza la selezione di un campo senza aspettare l'evento del DOM.
   * Utile nei test o quando il componente deve impostare il focus programmaticamente.
   */
  setField(dataField: string, field: FieldMetadata): void {
    this._setFocusedField(dataField, field);
  }

  /**
   * Chiamato da (mousedown) sul form body: deseleziona il campo corrente
   * se si clicca su un'area vuota (non su un editor o checkbox).
   */
  onFormMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target?.tagName === 'INPUT') return;
    if (target?.closest?.('.dx-checkbox')) return;
    this.clear();
  }

  /**
   * Post-processor da passare a `FormItemsBuilderOptions.postProcess`.
   * Inietta negli editorOptions di ogni item gli handler per il tracking.
   *
   * Restituisce una funzione freccia (anziché un metodo) così può essere
   * passata direttamente come callback senza perdere il contesto `this`.
   */
  readonly asPostProcessor = (item: any, field: FieldMetadata): void => {
    const df = field.dataField;
    item.editorOptions ??= {};

    // onFocusIn — handler principale (tutti gli editor eccetto checkbox)
    const prevFocusIn = item.editorOptions.onFocusIn;
    item.editorOptions.onFocusIn = (e: any) => {
      this._setFocusedField(df, field);
      prevFocusIn?.(e);
    };

    if (isCheckBox(item.editorType)) {
      // Checkbox: onFocusIn non è affidabile → intercettiamo via addEventListener
      const prevContentReady = item.editorOptions.onContentReady;
      item.editorOptions.onContentReady = (e: any) => {
        e.element?.addEventListener(
          'focus',
          () => this._setFocusedField(df, field),
          true, // capture phase per intercettare prima del widget
        );
        prevContentReady?.(e);
      };

      // Checkbox: aggiorna al cambio di valore (il click cambia valore PRIMA del focus)
      const prevValueChanged = item.editorOptions.onValueChanged;
      item.editorOptions.onValueChanged = (e: any) => {
        this._setFocusedField(df, field);
        prevValueChanged?.(e);
      };
    }
  };

  // ─── Privato ────────────────────────────────────────────────────────────

  private _setFocusedField(dataField: string, field: FieldMetadata): void {
    this._focusedField = dataField;
    this._info = {
      dataField,
      caption: field.caption,
      colSpan: field.control.colSpan ?? 1,
      visible: field.control.visible ?? true,
      readOnly: field.control.readOnly ?? false,
      required: field.control.required ?? false,
      lineBreak: field.control.lineBreak ?? false,
      cardIndex: field.control.cardIndex ?? 999,
    };
  }
}

// ─── Utility locale ──────────────────────────────────────────────────────────

function isCheckBox(editorType?: string): boolean {
  return editorType === 'dxCheckBox';
}
