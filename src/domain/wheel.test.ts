import { describe, expect, test } from 'vitest';
import {
  buildPrizeSegments,
  choosePrizeSegment,
  getPrizeLabelFontSize,
  normalizePrizeEntries,
} from './wheel.js';

describe('wheel domain', () => {
  test('normalizes manual prize lines and removes blank entries', () => {
    expect(
      normalizePrizeEntries(' Pix surpresa \n\nJantar\n  Brinde V4  '),
    ).toEqual(['Pix surpresa', 'Jantar', 'Brinde V4']);
  });

  test('creates one equal wheel segment per prize', () => {
    const segments = buildPrizeSegments(['Pix', 'Jantar', 'Mentoria']);

    expect(segments).toEqual([
      expect.objectContaining({
        endAngle: 120,
        label: 'Pix',
        startAngle: 0,
      }),
      expect.objectContaining({
        endAngle: 240,
        label: 'Jantar',
        startAngle: 120,
      }),
      expect.objectContaining({
        endAngle: 360,
        label: 'Mentoria',
        startAngle: 240,
      }),
    ]);
  });

  test('chooses a deterministic prize with injected rng', () => {
    const result = choosePrizeSegment(
      ['Pix', 'Jantar', 'Mentoria'],
      () => 0.52,
      720,
    );

    expect(result?.segment.label).toBe('Jantar');
    expect(result?.targetRotation).toBeGreaterThan(720);
  });

  test('reduces wheel label font size as prize names get longer', () => {
    expect(getPrizeLabelFontSize('Jantar')).toBe('clamp(1rem, 2.25vw, 2.5rem)');
    expect(getPrizeLabelFontSize('Vale R$ 500')).toBe(
      'clamp(0.88rem, 1.85vw, 1.95rem)',
    );
    expect(getPrizeLabelFontSize('Pix surpresa do mes')).toBe(
      'clamp(0.78rem, 1.55vw, 1.65rem)',
    );
    expect(getPrizeLabelFontSize('Mentoria estrategica completa')).toBe(
      'clamp(0.68rem, 1.22vw, 1.3rem)',
    );
  });
});
