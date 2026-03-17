export interface ParquetColumn {
  name: string;
  type: string;
  optional: boolean;
  children?: ParquetColumn[];
  path: string[];
}

export interface ParquetMetadata {
  numRows: number;
  numRowGroups: number;
  columns: ParquetColumn[];
  createdBy?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
}
