// pagine/allegati/allegati.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ZzDataGridComponent } from '@zng/core/components/zz-data-grid/zz-data-grid.component';
import { DxButtonModule, DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-allegati',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, ZzDataGridComponent],
  templateUrl: './allegati.component.html',
  styleUrl: './allegati.component.scss',
})
export class AllegatiComponent {
  dataset = 'Risorsa.Allegati';
  download(f: any) {
    alert('Download in corso: ' + f.titolo);
  }

  onDownloadFile(rowData: any): void {
    const fileId = rowData.ID_OBJECT_FILE;
    if (fileId) {
      // this.fileService.download(fileId);
      alert(fileId);
    }
  }
}
