/** Fixed-capacity Map that evicts least-recently-used entries on set. */

export class LruMap<K, V> {
  private readonly maxSize: number;
  private readonly map = new Map<K, V>();

  constructor(maxSize: number) {
    this.maxSize = Math.max(1, maxSize);
  }

  get size() {
    return this.map.size;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.touch(key, value);
    return value;
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    this.evictIfNeeded();
    return this;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  keys(): K[] {
    return [...this.map.keys()];
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  private touch(key: K, value: V) {
    this.map.delete(key);
    this.map.set(key, value);
  }

  private evictIfNeeded() {
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }
}
