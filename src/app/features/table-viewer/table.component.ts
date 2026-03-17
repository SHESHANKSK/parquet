import { Component, input, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { ParquetService } from '../../core/services/parquet.service';
import { ParquetColumn } from '../../shared/models/parquet.model';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-table-viewer',
  imports: [CommonModule, AgGridAngular],
  standalone: true,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          @if (parquetService.isQueryMode()) {
            <span
                class="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">Query Results</span>
            <span class="text-xs text-zinc-500">{{ parquetService.queryResult()?.length || 0 }} rows found</span>
          } @else {
            <span class="px-2 py-1 bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded">Full Dataset</span>
            <span class="text-xs text-zinc-500">{{ parquetService.metadata()?.numRows || 0 }} total rows</span>
          }
        </div>
        <button
            (click)="exportCsv()"
            class="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
        >
          <i class="scale-75">download</i>
          Export CSV
        </button>
      </div>

      <div class="h-[600px] w-full bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <ag-grid-angular
            class="h-full w-full"
            [theme]="theme"
            [columnDefs]="colDefs()"
            [defaultColDef]="defaultColDef"
            [rowModelType]="'infinite'"
            [cacheBlockSize]="100"
            [maxBlocksInCache]="10"
            [rowBuffer]="10"
            (gridReady)="onGridReady($event)"
        />
      </div>
    </div>
  `
})
export class TableComponent {
  columns = input.required<ParquetColumn[]>();
  parquetService = inject(ParquetService);

  theme = themeQuartz;
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
    // Handle column changes
    effect(() => {
      const isQueryMode = this.parquetService.isQueryMode();
      const cols = isQueryMode ? this.parquetService.queryColumns() : this.columns();
      
      if (cols && cols.length > 0) {
        this.colDefs.set(cols.map(c => ({
          field: c.name,
          headerName: c.name,
          tooltipField: c.name
        })));
        
        // Refresh grid if columns change
        if (this.gridApi) {
          this.gridApi.setGridOption('columnDefs', this.colDefs());
          this.gridApi.refreshInfiniteCache();
        }
      }
    });

    // Handle query result changes
    effect(() => {
      if (this.parquetService.isQueryMode() && this.gridApi) {
        this.gridApi.refreshInfiniteCache();
      }
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    
    const datasource: IDatasource = {
      getRows: async (params: IGetRowsParams) => {
        try {
          let rows: Record<string, unknown>[] = [];
          let totalRows = -1;

          if (this.parquetService.isQueryMode()) {
            const queryResult = this.parquetService.queryResult() || [];
            rows = queryResult.slice(params.startRow, params.endRow);
            totalRows = queryResult.length;
          } else {
            rows = await this.parquetService.readRows(params.startRow, params.endRow);
            totalRows = this.parquetService.metadata()?.numRows || -1;
          }

          params.successCallback(rows, totalRows);
        } catch (error) {
          console.error('Error fetching rows:', error);
          params.failCallback();
        }
      }
    };

    this.gridApi.setGridOption('datasource', datasource);
    params.api.sizeColumnsToFit();
  }

  exportCsv() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv();
    }
  }
}
