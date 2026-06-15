export interface PrizeSegment {
  readonly colorIndex: number;
  readonly endAngle: number;
  readonly id: string;
  readonly label: string;
  readonly middleAngle: number;
  readonly startAngle: number;
}

export interface PrizeSpinResult {
  readonly segment: PrizeSegment;
  readonly targetRotation: number;
}

export type WheelRng = () => number;

const FULL_ROTATION_DEGREES = 360;
const MINIMUM_SPIN_DEGREES = 1440;
const POINTER_ANGLE_DEGREES = 90;
const DEFAULT_LABEL_FONT_SIZE = 'clamp(1rem, 2.25vw, 2.5rem)';
const MEDIUM_LABEL_FONT_SIZE = 'clamp(0.88rem, 1.85vw, 1.95rem)';
const LONG_LABEL_FONT_SIZE = 'clamp(0.78rem, 1.55vw, 1.65rem)';
const EXTRA_LONG_LABEL_FONT_SIZE = 'clamp(0.68rem, 1.22vw, 1.3rem)';

export function normalizePrizeEntries(input: string): readonly string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function buildPrizeSegments(
  prizes: readonly string[],
): readonly PrizeSegment[] {
  const labels = prizes.map((prize) => prize.trim()).filter(Boolean);

  if (labels.length === 0) {
    return [];
  }

  const segmentAngle = FULL_ROTATION_DEGREES / labels.length;

  return labels.map((label, index) => {
    const startAngle = index * segmentAngle;
    const endAngle =
      index === labels.length - 1
        ? FULL_ROTATION_DEGREES
        : (index + 1) * segmentAngle;

    return {
      colorIndex: index,
      endAngle,
      id: `${index}-${slugifyPrize(label)}`,
      label,
      middleAngle: startAngle + (endAngle - startAngle) / 2,
      startAngle,
    };
  });
}

export function choosePrizeSegment(
  prizes: readonly string[],
  rng: WheelRng = Math.random,
  currentRotation = 0,
): PrizeSpinResult | null {
  const segments = buildPrizeSegments(prizes);

  if (segments.length === 0) {
    return null;
  }

  const randomValue = clampRandomValue(rng());
  const selectedIndex = Math.min(
    segments.length - 1,
    Math.floor(randomValue * segments.length),
  );
  const segment = segments[selectedIndex];
  const currentNormalizedRotation = normalizeAngle(currentRotation);
  const targetNormalizedRotation = normalizeAngle(
    POINTER_ANGLE_DEGREES - segment.middleAngle,
  );
  const deltaToTarget = normalizeAngle(
    targetNormalizedRotation - currentNormalizedRotation,
  );

  return {
    segment,
    targetRotation: currentRotation + MINIMUM_SPIN_DEGREES + deltaToTarget,
  };
}

export function getPrizeLabelFontSize(label: string): string {
  const characterCount = Array.from(label.replace(/\s+/g, ' ').trim()).length;

  if (characterCount > 24) {
    return EXTRA_LONG_LABEL_FONT_SIZE;
  }

  if (characterCount > 16) {
    return LONG_LABEL_FONT_SIZE;
  }

  if (characterCount > 8) {
    return MEDIUM_LABEL_FONT_SIZE;
  }

  return DEFAULT_LABEL_FONT_SIZE;
}

function clampRandomValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(0.999999999, Math.max(0, value));
}

function normalizeAngle(angle: number): number {
  return (
    ((angle % FULL_ROTATION_DEGREES) + FULL_ROTATION_DEGREES) %
    FULL_ROTATION_DEGREES
  );
}

function slugifyPrize(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
