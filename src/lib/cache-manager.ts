// src/lib/cache-manager.ts
class CacheManager {
  private cache: Map<string, any> = new Map();
  private timestamps: Map<string, number> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key: string): any | null {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;

    if (Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    });
  }
}

export const cacheManager = new CacheManager();