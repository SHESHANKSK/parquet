import { Injectable, signal } from '@angular/core';
import { parquetMetadata, parquetRead } from 'hyparquet';
import { ParquetMetadata, ParquetColumn } from '../../shared/models/parquet.model';

@Injectable({
  providedIn: 'root'
})
export class ParquetService {
  metadata = signal<ParquetMetadata | null>(null);
  data = signal<Record<string, unknown>[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async loadFile(buffer: ArrayBuffer) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const uint8Array = new Uint8Array(buffer);
      
      // Get metadata
      const meta = parquetMetadata(uint8Array);
      
      const columns: ParquetColumn[] = meta.schema.map((s: { name: string; type?: string; repetition_type?: string }) => ({
        name: s.name,
        type: s.type || 'STRUCT',
        optional: s.repetition_type === 'OPTIONAL',
        path: [s.name]
      })).filter((c: ParquetColumn) => c.name !== 'schema'); // hyparquet schema root is usually named 'schema'

      this.metadata.set({
        numRows: Number(meta.num_rows),
        numRowGroups: meta.row_groups.length,
        columns: columns,
        createdBy: meta.created_by
      });

      // Read data
      await parquetRead({
        file: uint8Array,
        onComplete: (data: unknown[]) => {
          this.data.set(data as Record<string, unknown>[]);
          this.loading.set(false);
        }
      });

    } catch (err: unknown) {
      console.error('Parquet parsing error:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to parse parquet file');
      this.loading.set(false);
    }
  }

  reset() {
    this.metadata.set(null);
    this.data.set([]);
    this.error.set(null);
  }
}
