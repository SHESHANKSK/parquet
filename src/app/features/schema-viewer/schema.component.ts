import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParquetColumn } from '../../shared/models/parquet.model';

@Component({
  selector: 'app-schema-viewer',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      <div
          class="grid grid-cols-3 bg-zinc-50 border-bottom border-zinc-200 p-4 text-xs font-mono uppercase tracking-wider text-zinc-500">
        <div>Column Name</div>
        <div>Data Type</div>
        <div>Nullable</div>
      </div>

      <div class="divide-y divide-zinc-100">
        @for (col of columns(); track col.name) {
          <div class="grid grid-cols-3 p-4 hover:bg-zinc-50 transition-colors">
            <div class="font-medium text-zinc-900">{{ col.name }}</div>
            <div class="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded w-fit">{{ col.type }}</div>
            <div class="text-zinc-400">
              @if (col.optional) {
                <span class="text-emerald-600">Yes</span>
              } @else {
                <span class="text-zinc-300">No</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SchemaComponent {
  columns = input.required<ParquetColumn[]>();
}
