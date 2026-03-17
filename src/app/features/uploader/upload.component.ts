import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, MatIconModule],
  template: `
    <div 
      class="border-2 border-dashed border-zinc-300 rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-zinc-500 hover:bg-zinc-50"
      [class.bg-zinc-100]="isDragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
      (keydown.enter)="fileInput.click()"
      (keydown.space)="fileInput.click()"
      tabindex="0"
      role="button"
      aria-label="Upload Parquet File"
    >
      <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept=".parquet">
      
      <div class="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
        <mat-icon class="text-zinc-600 scale-150">upload_file</mat-icon>
      </div>
      
      <h3 class="text-xl font-medium text-zinc-900 mb-2">Upload Parquet File</h3>
      <p class="text-zinc-500 text-center max-w-xs">
        Drag and drop your .parquet file here, or click to browse.
      </p>
      <p class="mt-4 text-xs font-mono text-zinc-400 uppercase tracking-widest">Max size: 200MB</p>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class UploadComponent {
  @Output() fileSelected = new EventEmitter<File>();
  isDragging = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    if (file.name.endsWith('.parquet')) {
      this.fileSelected.emit(file);
    } else {
      alert('Please upload a valid .parquet file');
    }
  }
}
