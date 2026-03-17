import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ParquetService } from '../../core/services/parquet.service';

@Component({
  selector: 'app-sql-query',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <mat-icon>terminal</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-zinc-900">SQL Query Console</h3>
            <p class="text-xs text-zinc-500">Query your parquet data using standard SQL</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="resetQuery()" 
            class="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button 
            (click)="runQuery()" 
            [disabled]="parquetService.loading()"
            class="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <mat-icon class="scale-75">play_arrow</mat-icon>
            Run Query
          </button>
        </div>
      </div>

      <div class="relative">
        <textarea
          [(ngModel)]="query"
          placeholder="SELECT * FROM ? WHERE column_name > 100 LIMIT 10"
          class="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
        ></textarea>
        <div class="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
          <span class="text-[10px] font-mono text-zinc-400">Use '?' to refer to the parquet data</span>
        </div>
      </div>

      @if (parquetService.error()) {
        <div class="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
          <mat-icon class="text-red-500 scale-75 mt-0.5">error_outline</mat-icon>
          <p class="text-xs text-red-700">{{ parquetService.error() }}</p>
        </div>
      }

      <div class="flex flex-wrap gap-2">
        <span class="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Examples:</span>
        <button (click)="setExample(1)" class="text-[10px] px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md transition-colors">Select All</button>
        <button (click)="setExample(2)" class="text-[10px] px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md transition-colors">Filter & Sort</button>
        <button (click)="setExample(3)" class="text-[10px] px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md transition-colors">Aggregation</button>
      </div>
    </div>
  `
})
export class SqlQueryComponent {
  parquetService = inject(ParquetService);
  query = signal<string>('SELECT * FROM ? LIMIT 100');

  runQuery() {
    if (this.query().trim()) {
      this.parquetService.executeQuery(this.query());
    }
  }

  resetQuery() {
    this.query.set('SELECT * FROM ? LIMIT 100');
    this.parquetService.resetQuery();
  }

  setExample(id: number) {
    const cols = this.parquetService.metadata()?.columns || [];
    const firstCol = cols[0]?.name || 'column_name';
    
    switch(id) {
      case 1:
        this.query.set('SELECT * FROM ?');
        break;
      case 2:
        this.query.set(`SELECT * FROM ? WHERE ${firstCol} IS NOT NULL ORDER BY ${firstCol} DESC LIMIT 50`);
        break;
      case 3:
        this.query.set(`SELECT COUNT(*) as count, ${firstCol} FROM ? GROUP BY ${firstCol}`);
        break;
    }
  }
}
