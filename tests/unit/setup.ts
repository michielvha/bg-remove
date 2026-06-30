// jsdom does not implement object URLs or image loading. These shims let the
// app's upload/download flow run deterministically under Vitest.

// jsdom only exposes localStorage for non-opaque origins; provide a simple
// in-memory implementation so theme persistence is testable everywhere.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});

let objectUrlCounter = 0;

window.URL.createObjectURL = () => `blob:mock/${objectUrlCounter++}`;
window.URL.revokeObjectURL = () => {
  /* no-op */
};

// jsdom never fires `load` when an <img> src is assigned. Simulate a successful
// async load so the `await img.onload` promise in handleFile resolves.
Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
  configurable: true,
  get(this: HTMLImageElement) {
    return this.getAttribute('src') ?? '';
  },
  set(this: HTMLImageElement, value: string) {
    this.setAttribute('src', value);
    setTimeout(() => {
      this.dispatchEvent(new Event('load'));
    });
  },
});
