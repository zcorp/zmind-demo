import { StorageInterface } from './StorageInterface';

// Stub pour Phase 2 - ne pas implémenter maintenant
// En Phase 2, ceci deviendra une implémentation via API REST
export class RemoteStorage implements StorageInterface {
  async save(): Promise<void> {
    throw new Error('RemoteStorage pas implémenté en Phase 1');
  }

  async load(): Promise<any> {
    throw new Error('RemoteStorage pas implémenté en Phase 1');
  }

  async list(): Promise<any[]> {
    throw new Error('RemoteStorage pas implémenté en Phase 1');
  }

  async delete(): Promise<void> {
    throw new Error('RemoteStorage pas implémenté en Phase 1');
  }
}
