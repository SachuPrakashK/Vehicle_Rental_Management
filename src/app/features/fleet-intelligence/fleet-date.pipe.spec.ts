import { describe, expect, it } from 'vitest';
import { FleetDatePipe } from './fleet-date.pipe';

describe('FleetDatePipe', () => {
  const pipe = new FleetDatePipe();

  it('formats date-only values without timezone shifts', () => {
    expect(pipe.transform('2026-11-03')).toBe('03 Nov 2026');
    expect(pipe.transform('2024-02-29')).toBe('29 Feb 2024');
    expect(pipe.transform('2026-12-31')).toBe('31 Dec 2026');
  });

  it('formats timestamps in Asia Kolkata and handles unavailable values', () => {
    expect(pipe.transform('2026-11-02T20:00:00.000Z')).toBe('03 Nov 2026');
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('invalid')).toBe('—');
  });
});
