import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly size = input(10);
  readonly changed = output<number>();
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  readonly first = computed(() => (this.total() ? (this.page() - 1) * this.size() + 1 : 0));
  readonly last = computed(() => Math.min(this.page() * this.size(), this.total()));
}
