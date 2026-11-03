import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icons/icon.component';

interface CalendarDay {
  value: string;
  day: number;
  currentMonth: boolean;
  today: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  imports: [IconComponent],
  templateUrl: './date-picker.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'documentClick($event)',
    '(document:keydown.escape)': 'close(true)',
    '(window:resize)': 'reposition()',
    '(window:scroll)': 'reposition()',
  },
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  readonly value = input<string>();
  readonly inputId = input('');
  readonly min = input('');
  readonly max = input('');
  readonly placeholder = input('dd-mm-yyyy');
  readonly ariaLabel = input('Select date');
  readonly clearable = input(true);
  readonly required = input(false);
  readonly disabledDates = input<string[]>([]);
  readonly rangeStart = input('');
  readonly rangeEnd = input('');
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly selected = signal('');
  readonly disabledState = signal(false);
  readonly viewDate = signal(this.startOfMonth(new Date()));
  readonly popupTop = signal(0);
  readonly popupLeft = signal(0);
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(this.viewDate()),
  );
  readonly displayValue = computed(() => this.formatDisplay(this.selected()));
  readonly days = computed<CalendarDay[]>(() => {
    const view = this.viewDate();
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const today = this.toValue(new Date());
    const disabledDates = new Set(this.disabledDates());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const value = this.toValue(date);
      return {
        value,
        day: date.getDate(),
        currentMonth: date.getMonth() === view.getMonth(),
        today: value === today,
        disabled:
          (!!this.min() && value < this.min()) ||
          (!!this.max() && value > this.max()) ||
          disabledDates.has(value),
      };
    });
  });
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const value = this.value();
      if (value !== undefined && value !== this.selected()) this.applyExternalValue(value);
    });
  }

  writeValue(value: string | null): void {
    this.applyExternalValue(value ?? '');
  }
  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }
  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }
  setDisabledState(disabled: boolean): void {
    this.disabledState.set(disabled);
  }

  toggle(): void {
    if (this.disabledState()) return;
    this.open() ? this.close(true) : this.show();
  }

  show(): void {
    const selected = this.parse(this.selected());
    if (selected) this.viewDate.set(this.startOfMonth(selected));
    this.reposition();
    this.open.set(true);
  }

  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
    if (restoreFocus)
      queueMicrotask(() =>
        this.element.nativeElement.querySelector<HTMLElement>('.date-picker-input')?.focus(),
      );
  }

  select(day: CalendarDay): void {
    if (day.disabled) return;
    this.commit(day.value);
    this.close(true);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.commit('');
    this.onTouched();
  }

  previousMonth(): void {
    this.shiftMonth(-1);
  }
  nextMonth(): void {
    this.shiftMonth(1);
  }

  dayKeydown(event: KeyboardEvent, day: CalendarDay): void {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const current = this.parse(day.value)!;
    const target = new Date(current.getFullYear(), current.getMonth(), current.getDate() + offset);
    this.viewDate.set(this.startOfMonth(target));
    const value = this.toValue(target);
    queueMicrotask(() =>
      this.element.nativeElement.querySelector<HTMLElement>(`[data-date="${value}"]`)?.focus(),
    );
  }

  isInRange(value: string): boolean {
    return (
      !!this.rangeStart() &&
      !!this.rangeEnd() &&
      value > this.rangeStart() &&
      value < this.rangeEnd()
    );
  }
  documentClick(event: Event): void {
    if (this.open() && !this.element.nativeElement.contains(event.target as Node)) this.close();
  }

  reposition(): void {
    if (!this.open() && !this.element.nativeElement.isConnected) return;
    const anchor = this.element.nativeElement.querySelector<HTMLElement>('.date-picker-control');
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const height = 390;
    const below = rect.bottom + 8;
    this.popupTop.set(
      below + height <= window.innerHeight ? below : Math.max(12, rect.top - height - 8),
    );
    this.popupLeft.set(Math.min(Math.max(12, rect.left), window.innerWidth - width - 12));
  }

  private shiftMonth(offset: number): void {
    const date = this.viewDate();
    this.viewDate.set(new Date(date.getFullYear(), date.getMonth() + offset, 1));
  }
  private commit(value: string): void {
    this.selected.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }
  private applyExternalValue(value: string): void {
    this.selected.set(value);
    const date = this.parse(value);
    if (date) this.viewDate.set(this.startOfMonth(date));
  }
  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  private parse(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }
  private toValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private formatDisplay(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  }
}
