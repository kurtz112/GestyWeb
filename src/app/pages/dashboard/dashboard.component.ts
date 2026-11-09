import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
// ─── Componenti ZZ ────────────────────────────────────────────────────────────
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZzFormComponent } from '@zng/core/components/zz-form/zz-form.component';
import { ActionButton, ActionButtonEvent } from '@zng/core/models/action-button.model';
import { AuthService } from '@zng/core/services/auth.service';
import {
  StoredProcParam,
  StoredProcRequest,
  ZServerService,
} from '@zng/core/services/zserver.service';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxTextBoxModule,
    DxButtonModule,
    DxTextAreaModule,
    DxTabPanelModule,
    DxPopupModule,
    DxScrollViewModule,
    ZzDataGridComponent,
    ZzFormComponent,
  ],
  template: `
    <div class="dashboard">
      <!-- ═══════════════════════════════════════════════════════════
           HEADER — palette Gesty (verde foresta)
           ═══════════════════════════════════════════════════════════ -->
      <header class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-icon">⚡</span>
          <h3>Dashboard Test</h3>
        </div>
        <div class="toolbar-right">
          <span class="user-info">
            {{ currentUser()?.displayname || currentUser()?.username || '?' }}
            <small>({{ currentUser()?.role }})</small>
          </span>
          <dx-button text="Logout" icon="runner" stylingMode="text" (onClick)="onLogout()">
          </dx-button>
        </div>
      </header>

      <!-- ═══════════════════════════════════════════════════════════
           TOKEN BAR
           ═══════════════════════════════════════════════════════════ -->
      <div class="token-bar">
        <div class="token-info">
          <strong>Access Token:</strong>
          <code>{{ accessTokenPreview() }}</code>
          <span class="token-exp">scade: {{ tokenExpiration() }}</span>
        </div>
        <dx-button
          text="Forza Refresh"
          icon="refresh"
          stylingMode="outlined"
          (onClick)="onForceRefresh()"
        >
        </dx-button>
        <dx-button
          text="Dettagli JWT"
          icon="info"
          stylingMode="outlined"
          (onClick)="showTokenDetails = true"
        >
        </dx-button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           TAB PANEL
           ═══════════════════════════════════════════════════════════ -->
      <div class="tab-panel-wrapper">
        <dx-tab-panel [animationEnabled]="true" [swipeEnabled]="false">
          <!-- ──────────────────────────────────────────────────────
               TAB 1 — ZzDataGrid (sostituisce dx-data-grid)
               ────────────────────────────────────────────────────── -->
          <dxi-item title="ZzDataGrid" icon="grid">
            <div class="tab-content">
              <!-- Configurazione -->
              <div class="config-row">
                <div class="config-field">
                  <label>Dataset ID</label>
                  <dx-text-box
                    [(value)]="datasetId"
                    placeholder="es: DM.STUDENTI, DM.AZIENDE..."
                    [showClearButton]="true"
                    (onEnterKey)="onLoadGrid()"
                  >
                  </dx-text-box>
                </div>
                <div class="config-buttons">
                  <dx-button
                    text="Carica Grid"
                    type="default"
                    icon="download"
                    (onClick)="onLoadGrid()"
                  >
                  </dx-button>
                  <dx-button
                    text="Ricarica"
                    icon="refresh"
                    stylingMode="outlined"
                    [disabled]="!gridDataset()"
                    (onClick)="onRefreshGrid()"
                  >
                  </dx-button>
                </div>
              </div>

              @if (gridMessage()) {
                <div class="status-message" [class.error]="gridMessageIsError()">
                  {{ gridMessage() }}
                </div>
              }

              <!-- ZzDataGrid — sostituisce dx-data-grid -->
              @if (gridDataset()) {
                <zz-data-grid
                  #zzGrid
                  [dataset]="gridDataset()!"
                  [height]="460"
                  (rowInserted)="onRowEvent('Inserito')"
                  (rowUpdated)="onRowEvent('Aggiornato')"
                  (rowRemoved)="onRowEvent('Eliminato')"
                  (dataError)="onDataError($event)"
                  [customButtons]="myButtons"
                  (actionButtonClick)="onAction($event)"
                >
                </zz-data-grid>
              }

              @if (!gridDataset()) {
                <div class="empty-state">
                  <i
                    class="dx-icon dx-icon-grid"
                    style="font-size: 48px; color: var(--gesty-border);"
                  ></i>
                  <p>Inserisci un Dataset ID e premi <strong>Carica Grid</strong></p>
                </div>
              }
            </div>
          </dxi-item>

          <!-- ──────────────────────────────────────────────────────
               TAB 2 — ZzForm (nuovo tab di test)
               ────────────────────────────────────────────────────── -->
          <dxi-item title="ZzForm" icon="fields">
            <div class="tab-content">
              <!-- Configurazione Form -->
              <div class="config-row">
                <div class="config-field">
                  <label>Dataset ID</label>
                  <dx-text-box
                    [(value)]="formDatasetId"
                    placeholder="es: DM.STUDENTI, DM.AZIENDE..."
                    [showClearButton]="true"
                    (onEnterKey)="onLoadForm()"
                  >
                  </dx-text-box>
                </div>
                <div class="config-field">
                  <label>Modalità</label>
                  <div class="mode-buttons">
                    @for (m of formModes; track m.value) {
                      <dx-button
                        [text]="m.label"
                        [type]="formMode === m.value ? 'default' : 'normal'"
                        [stylingMode]="formMode === m.value ? 'contained' : 'outlined'"
                        (onClick)="formMode = m.value"
                      >
                      </dx-button>
                    }
                  </div>
                </div>
                <div class="config-buttons">
                  <dx-button
                    text="Carica Form"
                    type="default"
                    icon="download"
                    (onClick)="onLoadForm()"
                  >
                  </dx-button>
                  <dx-button
                    text="Reset"
                    icon="clear"
                    stylingMode="outlined"
                    [disabled]="!formDataset()"
                    (onClick)="onResetForm()"
                  >
                  </dx-button>
                </div>
              </div>

              <!-- Toggle Inline / Modale -->
              <div class="form-options-row">
                <label>Visualizzazione:</label>
                <div class="mode-buttons">
                  <dx-button
                    text="Inline"
                    [type]="!formAsModal ? 'default' : 'normal'"
                    [stylingMode]="!formAsModal ? 'contained' : 'outlined'"
                    (onClick)="formAsModal = false"
                  >
                  </dx-button>
                  <dx-button
                    text="Modale (Popup)"
                    [type]="formAsModal ? 'default' : 'normal'"
                    [stylingMode]="formAsModal ? 'contained' : 'outlined'"
                    (onClick)="formAsModal = true"
                  >
                  </dx-button>
                </div>
                @if (formAsModal && formDataset()) {
                  <dx-button
                    text="Apri Popup"
                    icon="expand"
                    type="success"
                    (onClick)="formModalVisible = true"
                  >
                  </dx-button>
                }
              </div>

              @if (formMessage()) {
                <div class="status-message" [class.error]="formMessageIsError()">
                  {{ formMessage() }}
                </div>
              }

              <!-- ZzForm — Inline -->
              @if (formDataset() && !formAsModal) {
                <div class="form-inline-wrapper card-gesty">
                  <zz-form
                    [dataset]="formDataset()!"
                    [mode]="formMode"
                    [modal]="false"
                    (saved)="onFormSaved($event)"
                    (cancelled)="onFormCancelled()"
                    [customButtons]="myButtons"
                    (actionButtonClick)="onAction($event)"
                  >
                  </zz-form>
                </div>
              }

              <!-- ZzForm — Modale -->
              @if (formDataset() && formAsModal) {
                <zz-form
                  [dataset]="formDataset()!"
                  [mode]="formMode"
                  [modal]="true"
                  [(visible)]="formModalVisible"
                  (saved)="onFormSaved($event)"
                  (cancelled)="onFormCancelled()"
                  [customButtons]="myButtons"
                  (actionButtonClick)="onAction($event)"
                >
                </zz-form>
              }

              <!-- Risultato salvataggio -->
              @if (formSaveResult()) {
                <div class="sp-result">
                  <label>Ultimo risultato saved:</label>
                  <pre>{{ formSaveResult() }}</pre>
                </div>
              }

              @if (!formDataset()) {
                <div class="empty-state">
                  <i
                    class="dx-icon dx-icon-form"
                    style="font-size: 48px; color: var(--gesty-border);"
                  ></i>
                  <p>Inserisci un Dataset ID e premi <strong>Carica Form</strong></p>
                </div>
              }
            </div>
          </dxi-item>

          <!-- ──────────────────────────────────────────────────────
               TAB 3 — Stored Procedure
               ────────────────────────────────────────────────────── -->
          <dxi-item title="Stored Procedure" icon="preferences">
            <div class="tab-content">
              <div class="config-row">
                <div class="config-field" style="flex:1">
                  <label>Nome Stored Procedure</label>
                  <dx-text-box
                    [(value)]="spName"
                    placeholder="es: SP_STUDENTI_CERCA, USR_LOGIN..."
                    [showClearButton]="true"
                  >
                  </dx-text-box>
                </div>
                <div class="config-buttons">
                  <dx-button text="Esegui" type="success" icon="runner" (onClick)="onExecuteSP()">
                  </dx-button>
                  <dx-button
                    text="Pulisci"
                    icon="clear"
                    stylingMode="outlined"
                    (onClick)="onClearSP()"
                  >
                  </dx-button>
                </div>
              </div>

              <div class="sp-params-area">
                <div class="sp-section">
                  <label>Parametri di Input (JSON)</label>
                  <dx-text-area
                    [(value)]="spInputJson"
                    [height]="140"
                    placeholder='[{"name":"P_COGNOME","value":"Rossi","dataType":"string"}]'
                  >
                  </dx-text-area>
                </div>
                <div class="sp-section">
                  <label>Parametri di Output (JSON)</label>
                  <dx-text-area
                    [(value)]="spOutputJson"
                    [height]="140"
                    placeholder='[{"name":"O_COUNT","dataType":"integer"}]'
                  >
                  </dx-text-area>
                </div>
              </div>

              @if (spResult()) {
                <div class="sp-result">
                  <label>Risultato:</label>
                  <pre>{{ spResult() }}</pre>
                </div>
              }
            </div>
          </dxi-item>

          <!-- ──────────────────────────────────────────────────────
               TAB 4 — Activity Log
               ────────────────────────────────────────────────────── -->
          <dxi-item title="Activity Log" icon="comment">
            <div class="tab-content">
              <dx-button
                text="Pulisci Log"
                icon="clear"
                stylingMode="outlined"
                (onClick)="logEntries = []"
              >
              </dx-button>
              <div class="log-area">
                @for (entry of logEntries; track entry.time) {
                  <div class="log-entry" [class.error]="entry.isError">
                    <span class="log-time">{{ entry.time }}</span>
                    <span class="log-msg">{{ entry.message }}</span>
                  </div>
                }
                @if (logEntries.length === 0) {
                  <div class="log-empty">Nessuna attività registrata</div>
                }
              </div>
            </div>
          </dxi-item>
        </dx-tab-panel>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           POPUP JWT
           ═══════════════════════════════════════════════════════════ -->
      <dx-popup
        [(visible)]="showTokenDetails"
        title="JWT Token Details"
        [width]="600"
        [height]="'auto'"
        [showCloseButton]="true"
      >
        <div class="token-details">
          <dx-scroll-view>
            <pre>{{ tokenDetailsJson() }}</pre>
          </dx-scroll-view>
        </div>
      </dx-popup>
    </div>
  `,
  styles: [
    `
      /* ── Layout generale ───────────────────────────────────────────── */
      .dashboard {
        min-height: 100vh;
        background: var(--gesty-bg, #f4f7f6);
        display: flex;
        flex-direction: column;
      }

      /* ── Toolbar header ────────────────────────────────────────────── */
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 24px;
        height: 56px;
        background: var(--gesty-primary, #2d5a27);
        color: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toolbar-icon {
        font-size: 1.2rem;
        opacity: 0.9;
      }

      .toolbar h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-info {
        font-size: 13px;
        opacity: 0.85;
      }

      .user-info small {
        opacity: 0.7;
        margin-left: 4px;
      }

      /* Override colore testo bottoni in toolbar scura */
      .toolbar ::ng-deep .dx-button-text,
      .toolbar ::ng-deep .dx-icon {
        color: rgba(255, 255, 255, 0.85) !important;
      }

      /* ── Token bar ─────────────────────────────────────────────────── */
      .token-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 24px;
        background: var(--gesty-accent, #dcecc8);
        border-bottom: 1px solid var(--gesty-border, #e5e7eb);
        font-size: 12px;
      }

      .token-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--gesty-primary, #2d5a27);
      }

      .token-info strong {
        font-weight: 600;
      }

      .token-info code {
        background: rgba(255, 255, 255, 0.7);
        padding: 2px 8px;
        border-radius: var(--radius-md, 8px);
        font-size: 11px;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: 1px solid var(--gesty-border, #e5e7eb);
      }

      .token-exp {
        color: var(--gesty-text-muted, #6b7280);
        font-style: italic;
      }

      /* ── Tab panel wrapper ─────────────────────────────────────────── */
      .tab-panel-wrapper {
        flex: 1;
        padding: 20px 24px;
      }

      /* ── Contenuto dei tab ─────────────────────────────────────────── */
      .tab-content {
        padding: 20px 4px 4px;
      }

      /* ── Riga configurazione ───────────────────────────────────────── */
      .config-row {
        display: flex;
        gap: 16px;
        align-items: flex-end;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .config-field {
        min-width: 220px;
      }

      .config-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        font-size: 12px;
        color: var(--gesty-text-muted, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .config-buttons {
        display: flex;
        gap: 8px;
      }

      /* ── Opzioni form ──────────────────────────────────────────────── */
      .form-options-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;

        label {
          font-weight: 600;
          font-size: 12px;
          color: var(--gesty-text-muted, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
      }

      .mode-buttons {
        display: flex;
        gap: 6px;
      }

      /* ── Status message ────────────────────────────────────────────── */
      .status-message {
        padding: 8px 14px;
        border-radius: var(--radius-md, 8px);
        margin-bottom: 14px;
        font-size: 13px;
        background: rgba(118, 176, 65, 0.12);
        color: var(--gesty-primary, #2d5a27);
        border: 1px solid rgba(118, 176, 65, 0.3);

        &.error {
          background: rgba(198, 40, 40, 0.08);
          color: #c62828;
          border-color: rgba(198, 40, 40, 0.25);
        }
      }

      /* ── Empty state ───────────────────────────────────────────────── */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
        color: var(--gesty-text-muted, #6b7280);
        text-align: center;
        gap: 12px;

        p {
          margin: 0;
          font-size: 14px;
        }

        strong {
          color: var(--gesty-primary, #2d5a27);
        }
      }

      /* ── Form inline wrapper ───────────────────────────────────────── */
      .form-inline-wrapper {
        padding: 24px !important;
        border-radius: var(--radius-lg, 16px);
        background: var(--gesty-card, #fff) !important;
        border: 1px solid var(--gesty-border, #e5e7eb) !important;
        box-shadow: var(--gesty-shadow) !important;
      }

      /* ── SP — parametri e risultato ────────────────────────────────── */
      .sp-params-area {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .sp-section {
        flex: 1;
      }

      .sp-section label,
      .sp-result label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        font-size: 12px;
        color: var(--gesty-text-muted, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .sp-result {
        margin-top: 16px;
      }

      .sp-result pre {
        background: #1e2a1a;
        color: var(--gesty-leaf, #76b041);
        padding: 16px;
        border-radius: var(--radius-md, 8px);
        font-size: 12px;
        overflow: auto;
        max-height: 300px;
        border: 1px solid rgba(118, 176, 65, 0.2);
      }

      /* ── Log ───────────────────────────────────────────────────────── */
      .log-area {
        margin-top: 12px;
        max-height: 420px;
        overflow: auto;
        border: 1px solid var(--gesty-border, #e5e7eb);
        border-radius: var(--radius-md, 8px);
        background: var(--gesty-card, #fff);
      }

      .log-entry {
        padding: 7px 12px;
        border-bottom: 1px solid var(--gesty-border, #e5e7eb);
        font-size: 12px;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        display: flex;
        gap: 12px;

        &:last-child {
          border-bottom: none;
        }

        &.error {
          color: #c62828;
          background: rgba(198, 40, 40, 0.04);
        }
      }

      .log-time {
        color: var(--gesty-text-muted, #6b7280);
        flex-shrink: 0;
        font-size: 11px;
        padding-top: 1px;
      }

      .log-msg {
        flex: 1;
      }

      .log-empty {
        color: var(--gesty-text-muted, #6b7280);
        text-align: center;
        padding: 40px;
        font-size: 13px;
      }

      /* ── JWT Popup ─────────────────────────────────────────────────── */
      .token-details pre {
        background: #1e2a1a;
        color: #a5d6a7;
        padding: 16px;
        border-radius: var(--radius-md, 8px);
        font-size: 12px;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private zserver = inject(ZServerService);

  // ─── State ────────────────────────────────────────────────────────────────

  currentUser = this.auth.currentUser;
  showTokenDetails = false;

  // ─── ZzDataGrid ───────────────────────────────────────────────────────────

  datasetId = 'AZIENDE';
  gridDataset = signal<string | null>(null);
  gridMessage = signal('');
  gridMessageIsError = signal(false);

  @ViewChild('zzGrid') zzGrid?: ZzDataGridComponent;

  // ─── ZzForm ───────────────────────────────────────────────────────────────

  formDatasetId = 'AZIENDE';
  formDataset = signal<string | null>(null);
  formMode: 'insert' | 'edit' | 'view' = 'insert';
  formAsModal = false;
  formModalVisible = false;
  formMessage = signal('');
  formMessageIsError = signal(false);
  formSaveResult = signal('');

  formModes = [
    { value: 'insert' as const, label: 'Insert' },
    { value: 'edit' as const, label: 'Edit' },
    { value: 'view' as const, label: 'View' },
  ];

  // ─── Stored Procedure ─────────────────────────────────────────────────────

  spName = '';
  spInputJson = '';
  spOutputJson = '';
  spResult = signal('');

  // ─── Log ──────────────────────────────────────────────────────────────────

  logEntries: { time: string; message: string; isError: boolean }[] = [];

  // ═══════════════════════════════════════════════════════════════════════════

  myButtons: ActionButton[] = [
    {
      id: 'print',
      text: 'Stampa',
      icon: 'print',
      target: 'both', // visibile sia nella grid che nella form
      formModes: ['edit', 'view'], // non in insert (non ha ancora un record)
      requiresSelection: true, // nella grid si disabilita senza selezione
    },
    {
      id: 'duplicate',
      text: 'Duplica',
      icon: 'copy',
      target: 'grid', // solo nella toolbar della grid
      requiresSelection: true,
    },
    {
      id: 'sendEmail',
      text: 'Invia email',
      icon: 'email',
      target: 'form', // solo nella form
      formModes: ['view'], // solo in consultazione
      location: 'before', // a sinistra
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════

  accessTokenPreview(): string {
    const token = this.auth.getAccessToken();
    return token ? token.substring(0, 30) + '...' : '(nessuno)';
  }

  tokenExpiration(): string {
    const payload = this.auth.currentUser();
    if (!payload?.exp) return '?';
    return new Date(payload.exp * 1000).toLocaleTimeString('it-IT');
  }

  tokenDetailsJson(): string {
    const payload = this.auth.currentUser();
    return payload ? JSON.stringify(payload, null, 2) : '(nessun token)';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS — Header
  // ═══════════════════════════════════════════════════════════════════════════

  onLogout(): void {
    this.addLog('Logout');
    this.auth.logout();
  }

  onForceRefresh(): void {
    this.addLog('Forza refresh token...');
    this.auth.refreshAccessToken().subscribe({
      next: () => this.addLog('✅ Token refreshed con successo'),
      error: (err) => this.addLog(`❌ Refresh fallito: ${err.message}`, true),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ZzDataGrid
  // ═══════════════════════════════════════════════════════════════════════════

  onLoadGrid(): void {
    const id = this.datasetId.trim();
    if (!id) {
      this.gridMessage.set('Inserisci un Dataset ID');
      this.gridMessageIsError.set(true);
      return;
    }
    this.addLog(`Caricamento ZzDataGrid: dataset="${id}"`);
    this.gridDataset.set(id);
    this.gridMessage.set(`ZzDataGrid collegato al dataset: ${id}`);
    this.gridMessageIsError.set(false);
  }

  onRefreshGrid(): void {
    if (this.zzGrid?.grid?.instance) {
      this.zzGrid.grid.instance.refresh();
      this.addLog('ZzDataGrid ricaricato');
    }
  }

  onRowEvent(action: string): void {
    this.addLog(`✅ ${action} record nel dataset "${this.gridDataset()}"`);
  }

  onDataError(e: any): void {
    const msg = e?.message || 'Errore caricamento dati';
    this.addLog(`❌ DataGrid error: ${msg}`, true);
    this.gridMessage.set(msg);
    this.gridMessageIsError.set(true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ZzForm
  // ═══════════════════════════════════════════════════════════════════════════

  onLoadForm(): void {
    const id = this.formDatasetId.trim();
    if (!id) {
      this.formMessage.set('Inserisci un Dataset ID');
      this.formMessageIsError.set(true);
      return;
    }
    this.addLog(`Caricamento ZzForm: dataset="${id}", mode="${this.formMode}"`);
    this.formDataset.set(id);
    this.formSaveResult.set('');
    this.formMessage.set(`ZzForm collegato al dataset: ${id}`);
    this.formMessageIsError.set(false);

    if (this.formAsModal) {
      this.formModalVisible = true;
    }
  }

  onResetForm(): void {
    this.formDataset.set(null);
    this.formSaveResult.set('');
    this.formMessage.set('');
    this.formModalVisible = false;
    this.addLog('ZzForm resettato');
  }

  onFormSaved(data: any): void {
    const json = JSON.stringify(data, null, 2);
    this.formSaveResult.set(json);
    this.formModalVisible = false;
    this.addLog(`✅ ZzForm: record salvato nel dataset "${this.formDataset()}"`);
  }

  onFormCancelled(): void {
    this.formModalVisible = false;
    this.addLog('ZzForm: operazione annullata');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Stored Procedure
  // ═══════════════════════════════════════════════════════════════════════════

  onExecuteSP(): void {
    if (!this.spName.trim()) {
      this.spResult.set('⚠️ Inserisci il nome della stored procedure');
      return;
    }

    let inputParams: StoredProcParam[] = [];
    let outputParams: { name: string; dataType: string }[] = [];

    try {
      if (this.spInputJson.trim()) inputParams = JSON.parse(this.spInputJson);
    } catch {
      this.spResult.set('❌ JSON parametri di input non valido');
      return;
    }

    try {
      if (this.spOutputJson.trim()) outputParams = JSON.parse(this.spOutputJson);
    } catch {
      this.spResult.set('❌ JSON parametri di output non valido');
      return;
    }

    const request: StoredProcRequest = { inputParams, outputParams };
    this.addLog(`Esecuzione SP: ${this.spName} (${inputParams.length} param input)`);

    this.zserver.executeStoredProcedure(this.spName.trim(), request).subscribe({
      next: (result) => {
        this.spResult.set(JSON.stringify(result, null, 2));
        this.addLog(`✅ SP ${this.spName} eseguita con successo`);
      },
      error: (err) => {
        this.spResult.set(`❌ Errore: ${err.message}`);
        this.addLog(`❌ SP ${this.spName} fallita: ${err.message}`, true);
      },
    });
  }

  onClearSP(): void {
    this.spName = '';
    this.spInputJson = '';
    this.spOutputJson = '';
    this.spResult.set('');
  }

  // ═══════════════════════════════════════════════════════════════════════════

  onAction(event: ActionButtonEvent) {
    alert(`Azione: ${event.button.text}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Log
  // ═══════════════════════════════════════════════════════════════════════════

  private addLog(message: string, isError = false): void {
    const time = new Date().toLocaleTimeString('it-IT', { hour12: false });
    this.logEntries.unshift({ time, message, isError });
  }
}
