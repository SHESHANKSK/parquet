import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from './core/services/file.service';
import { ParquetService } from './core/services/parquet.service';
import { UploadComponent } from './features/uploader/upload.component';
import { SchemaComponent } from './features/schema-viewer/schema.component';
import { TableComponent } from './features/table-viewer/table.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    UploadComponent, 
    SchemaComponent, 
    TableComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  fileService = inject(FileService);
  parquetService = inject(ParquetService);

  activeTab = signal<'data' | 'schema' | 'metadata'>('data');
  fileInfo = signal<{ name: string; size: number } | null>(null);

  async onFileSelected(file: File) {
    this.fileInfo.set({ name: file.name, size: file.size });
    this.fileService.setFile(file);
    
    const buffer = await this.fileService.readFileAsArrayBuffer(file);
    await this.parquetService.loadFile(buffer);
  }

  reset() {
    this.fileInfo.set(null);
    this.parquetService.reset();
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
