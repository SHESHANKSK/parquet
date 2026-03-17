import { Injectable, signal } from '@angular/core';
import { parquetMetadata, parquetReadObjects, FileMetaData, AsyncBuffer } from 'hyparquet';
import { ParquetMetadata, ParquetColumn } from '../../shared/models/parquet.model';

declare const alasql: any;

@Injectable({
  providedIn: 'root'
})
export class ParquetService {
  metadata = signal<ParquetMetadata | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // SQL Query related signals
  queryResult = signal<Record<string, unknown>[] | null>(null);
  queryColumns = signal<ParquetColumn[] | null>(null);
  isQueryMode = signal<boolean>(false);

  private fileBuffer: ArrayBuffer | null = null;
  private rawMetadata: FileMetaData | null = null;
  private allRows: Record<string, unknown>[] | null = null;

  async loadFile(buffer: ArrayBuffer) {
    this.loading.set(true);
    this.error.set(null);
    this.resetQuery();
    try {
      this.fileBuffer = buffer;
      this.allRows = null;
      
      // Get metadata
      this.rawMetadata = parquetMetadata(this.fileBuffer);
      
      const columns: ParquetColumn[] = this.rawMetadata.schema.map((s: { name: string; type?: string; repetition_type?: string }) => ({
        name: s.name,
        type: s.type || 'STRUCT',
        optional: s.repetition_type === 'OPTIONAL',
        path: [s.name]
      })).filter((c: ParquetColumn) => c.name !== 'schema');

      this.metadata.set({
        numRows: Number(this.rawMetadata.num_rows),
        numRowGroups: this.rawMetadata.row_groups.length,
        columns: columns,
        createdBy: this.rawMetadata.created_by
      });

      this.loading.set(false);
    } catch (err: unknown) {
      console.error('Parquet parsing error:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to parse parquet file');
      this.loading.set(false);
    }
  }

  async readRows(rowStart: number, rowEnd: number): Promise<Record<string, unknown>[]> {
    if (!this.fileBuffer || !this.rawMetadata) {
      return [];
    }
    
    try {
      // Use type assertion to satisfy hyparquet's AsyncBuffer requirement
      const data = await parquetReadObjects({
        file: this.fileBuffer as unknown as AsyncBuffer,
        metadata: this.rawMetadata,
        rowStart,
        rowEnd
      });
      return data as Record<string, unknown>[];
    } catch (err) {
      console.error('Error in readRows:', err);
      throw err;
    }
  }

  async executeQuery(sql: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Ensure we have all rows loaded for querying
      if (!this.allRows) {
        const totalRows = this.metadata()?.numRows || 0;
        // Limit to 100k rows for safety in browser memory if not specified
        // But for a "lens" app, we should probably try to load what we can
        this.allRows = await this.readRows(0, totalRows);
      }

      // alasql expects data as an array of objects
      // We use [?] as the table name and pass allRows as the parameter
      const result = alasql(sql, [this.allRows]);
      
      if (Array.isArray(result)) {
        this.queryResult.set(result as Record<string, unknown>[]);
        
        // Infer columns from the first result row
        if (result.length > 0) {
          const firstRow = result[0];
          const cols: ParquetColumn[] = Object.keys(firstRow).map(key => ({
            name: key,
            type: typeof firstRow[key] === 'number' ? 'DOUBLE' : 'BYTE_ARRAY',
            optional: true,
            path: [key]
          }));
          this.queryColumns.set(cols);
        } else {
          this.queryColumns.set([]);
        }
        this.isQueryMode.set(true);
      } else {
        throw new Error('Query did not return a result set');
      }
    } catch (err: unknown) {
      console.error('SQL query error:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to execute SQL query');
    } finally {
      this.loading.set(false);
    }
  }

  resetQuery() {
    this.queryResult.set(null);
    this.queryColumns.set(null);
    this.isQueryMode.set(false);
  }

  reset() {
    this.metadata.set(null);
    this.fileBuffer = null;
    this.rawMetadata = null;
    this.allRows = null;
    this.error.set(null);
    this.resetQuery();
  }
}
