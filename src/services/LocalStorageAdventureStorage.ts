import { AdventureProgress, AdventureStorage } from '@/types/adventure';

export class LocalStorageAdventureStorage implements AdventureStorage {
  private readonly STORAGE_KEY = 'adventureProgress';

  saveProgress(progress: AdventureProgress): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  }

  loadProgress(): AdventureProgress | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  clearProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
} 