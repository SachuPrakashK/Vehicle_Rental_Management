import { describe, expect, it } from 'vitest';
import {
  calculateHealthScore,
  calculateNextService,
} from '../services/fleet-intelligence.service.js';

describe('fleet intelligence rules', () => {
  it('calculates calendar and odometer maintenance intervals deterministically', () => {
    expect(calculateNextService('2026-01-01', 90, 10000, 5000)).toEqual({
      nextDate: '2026-04-01',
      nextOdometer: 15000,
    });
  });

  it('does not invent due values when historical inputs are unavailable', () => {
    expect(calculateNextService(null, 90, null, 5000)).toEqual({
      nextDate: null,
      nextOdometer: null,
    });
  });

  it('produces an explainable health score from recorded factors', () => {
    expect(calculateHealthScore(1, 1, true)).toEqual({
      score: 55,
      status: 'ATTENTION_RECOMMENDED',
    });
    expect(calculateHealthScore(4, 2, true)).toEqual({ score: 0, status: 'MAINTENANCE_REQUIRED' });
  });
});
