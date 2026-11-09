import { CommonModule } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { ZzFormComponent } from '@zng/core/components/zz-form/zz-form.component';
import { DatasetMetadata } from '@zng/core/models/metadata.models';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

@Component({
  selector: 'app-metadata-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxTextBoxModule,
    DxButtonModule,
    DxTabPanelModule,
    DxPopupModule,
    DxScrollViewModule,
    DxSwitchModule,
    DxSelectBoxModule,
    ZzDataGridComponent,
    ZzFormComponent,
  ],
  templateUrl: './metadata-demo.component.html',
  styleUrl: './metadata-demo.component.scss',
})
export class MetadataDemoComponent {
  @ViewChild('zzGrid') zzGrid!: ZzDataGridComponent;
  @ViewChild('zzForm') zzForm!: ZzFormComponent;

  datasetId = '';
  activeDataset = signal<string | null>('ZZ_WEB_DATASETS');
  currentMeta = signal<DatasetMetadata | null>(null);
  statusMessage = signal('');
  statusIsError = signal(false);

  formData: Record<string, any> = {};
  formReadOnly = true;
  showJson = false;

  recentDatasets: string[] = [];

  // ═══ Actions ═══

  onLoad(): void {
    const id = this.datasetId.trim();
    if (!id) {
      this.statusMessage.set('Inserisci un Dataset ID');
      this.statusIsError.set(true);
      return;
    }
    this.activeDataset.set(id);
    this.formData = {};
    this.statusMessage.set(`Caricamento "${id}"...`);
    this.statusIsError.set(false);
    this.addToRecent(id);
  }

  onReload(): void {
    if (this.activeDataset()) {
      this.currentMeta.set(null);
      const ds = this.activeDataset()!;
      this.activeDataset.set(null);
      setTimeout(() => {
        this.activeDataset.set(ds);
        this.formData = {};
      });
    }
  }

  onSelectRecent(e: any): void {
    if (e.value) {
      this.datasetId = e.value;
      this.onLoad();
    }
  }

  onMetadataLoaded(meta: DatasetMetadata): void {
    this.currentMeta.set(meta);
    this.statusMessage.set(
      `"${meta.caption}" — ${meta.fields.length} campi, ` +
        `PK: ${meta.primaryKey}, Layout: ${meta.formSettings.mode}`,
    );
    this.statusIsError.set(false);
  }

  onGridRowClick(e: any): void {
    if (e.data) {
      this.formData = { ...e.data };
      this.formReadOnly = true;
    }
  }

  onNewRecord(): void {
    this.formData = {};
    this.formReadOnly = false;
  }

  onFormFieldChanged(_e: { dataField: string; value: any }): void {
    // Hook per logica aggiuntiva al cambio campo
  }

  hasFormData(): boolean {
    return Object.keys(this.formData).length > 0;
  }

  metadataJson(): string {
    const meta = this.currentMeta();
    return meta ? JSON.stringify(meta, null, 2) : '(nessun metadato caricato)';
  }

  // ═══ Helpers ═══

  private addToRecent(id: string): void {
    this.recentDatasets = [id, ...this.recentDatasets.filter((d) => d !== id)].slice(0, 10);
  }
}
