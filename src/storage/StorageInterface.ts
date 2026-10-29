export interface MinderDocument {
  id: string;
  title: string;
  version: string;
  timestamp: number;
  rootNode: any; // Type plus précis quand Node.ts sera défini
}

export interface DocumentMeta {
  id: string;
  title: string;
  lastModified: number;
}

export interface StorageInterface {
  save(id: string, data: MinderDocument): Promise<void>;
  load(id: string): Promise<MinderDocument | null>;
  list(): Promise<DocumentMeta[]>;
  delete(id: string): Promise<void>;
}
