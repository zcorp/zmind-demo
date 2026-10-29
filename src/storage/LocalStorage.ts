import { StorageInterface, MinderDocument, DocumentMeta } from './StorageInterface';

export class LocalStorage implements StorageInterface {
  private storageKeyPrefix = 'minder_';

  async save(id: string, data: MinderDocument): Promise<void> {
    localStorage.setItem(
      this.storageKeyPrefix + id,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  }

  async load(id: string): Promise<MinderDocument | null> {
    const data = localStorage.getItem(this.storageKeyPrefix + id);
    return data ? JSON.parse(data) : null;
  }

  async list(): Promise<DocumentMeta[]> {
    const docs: DocumentMeta[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storageKeyPrefix)) {
        const data = JSON.parse(localStorage.getItem(key)!);
        docs.push({
          id: key.replace(this.storageKeyPrefix, ''),
          title: data.title || 'Sans titre',
          lastModified: data.timestamp || 0
        });
      }
    }
    return docs;
  }

  async delete(id: string): Promise<void> {
    localStorage.removeItem(this.storageKeyPrefix + id);
  }
}
