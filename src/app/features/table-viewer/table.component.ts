import { Component, input, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { MatIconModule } from '@angular/material/icon';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-table-viewer',
  imports: [CommonModule, AgGridAngular, MatIconModule],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex justify-end">
        <button 
          (click)="exportCsv()" 
          class="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
        >
          <mat-icon class="scale-75">download</mat-icon>
          Export CSV
        </button>
      </div>

      <div class="h-[600px] w-full bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <ag-grid-angular
          class="ag-theme-alpine h-full w-full"
          [rowData]="rowData()"
          [columnDefs]="colDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="100"
          [paginationPageSizeSelector]="[10, 50, 100, 500]"
          (gridReady)="onGridReady($event)"
        />
      </div>
    </div>
  `
})
export class TableComponent {
  rowData = input.required<Record<string, unknown>[]>();
  columns = input.required<ParquetColumn[]>();

  private gridApi!: GridApi;
  colDefs = signal<ColDef[]>([]);

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100
  };

  constructor() {
    effect(() => {
      const cols = this.columns();
      if (cols && cols.length > 0) {
        this.colDefs.set(cols.map(c => ({
          field: c.name,
          headerName: c.name,
          tooltipField: c.name
        })));
      }
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  exportCsv() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv();
    }
  }
}
