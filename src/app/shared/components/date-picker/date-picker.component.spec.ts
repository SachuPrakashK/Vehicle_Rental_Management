import { TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePickerComponent] }).compileComponents();
  });

  it('preserves and displays date-only values without timezone conversion', () => {
    const fixture = TestBed.createComponent(DatePickerComponent);
    fixture.componentInstance.writeValue('2026-01-01');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.date-picker-input')?.textContent,
    ).toContain('01-01-2026');
  });

  it('enforces the configured minimum date', () => {
    const fixture = TestBed.createComponent(DatePickerComponent);
    fixture.componentRef.setInput('min', '2026-11-10');
    fixture.componentInstance.writeValue('2026-11-15');
    fixture.componentInstance.show();
    fixture.detectChanges();

    const disabled = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-11-09"]',
    );
    const enabled = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-date="2026-11-10"]',
    );
    expect(disabled?.disabled).toBe(true);
    expect(enabled?.disabled).toBe(false);
  });

  it('propagates a selected date through ControlValueAccessor', () => {
    const fixture = TestBed.createComponent(DatePickerComponent);
    const changed = vi.fn();
    fixture.componentInstance.registerOnChange(changed);
    fixture.componentInstance.writeValue('2026-02-01');
    fixture.componentInstance.show();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-date="2026-02-14"]')
      ?.click();
    expect(changed).toHaveBeenCalledWith('2026-02-14');
  });
});
