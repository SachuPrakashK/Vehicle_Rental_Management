import { DestroyRef, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
export class ListState<T> {
  private readonly destroyRef = inject(DestroyRef);
  readonly records = signal<T[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly page = signal(1);
  readonly size = 10;
  readonly filtered = computed(() =>
    this.records().filter((record) => this.matches(record, this.search().trim().toLowerCase())),
  );
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.size)));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly visible = computed(() =>
    this.filtered().slice((this.currentPage() - 1) * this.size, this.currentPage() * this.size),
  );
  constructor(
    private readonly fetch: () => Observable<T[]>,
    private readonly matches: (record: T, query: string) => boolean,
  ) {}
  searchFor(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }
  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const records = await firstValueFrom(this.fetch().pipe(takeUntilDestroyed(this.destroyRef)));
      if (!Array.isArray(records)) throw new Error('Unable to load records. Please try again.');
      this.records.set(records);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load records.');
    } finally {
      this.loading.set(false);
    }
  }
}
