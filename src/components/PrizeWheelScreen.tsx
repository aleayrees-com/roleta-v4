import { RotateCcw, Trash2 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from 'react';
import {
  buildPrizeSegments,
  choosePrizeSegment,
  getPrizeLabelFontSize,
  normalizePrizeEntries,
  type PrizeSegment,
  type WheelRng,
} from '../domain/wheel.js';

interface PrizeWheelScreenProps {
  readonly rng?: WheelRng;
  readonly spinDurationMs?: number;
  readonly storageKey?: string;
}

type WheelStyle = CSSProperties & {
  readonly '--wheel-center-rotation': string;
  readonly '--wheel-rotation': string;
};

type SegmentLabelStyle = CSSProperties & {
  readonly '--segment-angle': string;
  readonly '--segment-count': number;
  readonly '--label-font-size': string;
};

const DEFAULT_STORAGE_KEY = 'v4-prize-wheel-prizes';
const DEFAULT_SPIN_DURATION_MS = 4200;
const DEFAULT_PRIZES = [
  'Vale R$ 500',
  'Jantar',
  'Mentoria',
  'Day off',
  'Brinde V4',
  'Pix surpresa',
] as const;
const WHEEL_COLORS = [
  '#e50000',
  '#ffffff',
  '#111111',
  '#ff2a2a',
  '#f2f2f2',
  '#2b2b2b',
] as const;

export function PrizeWheelScreen({
  rng,
  spinDurationMs = DEFAULT_SPIN_DURATION_MS,
  storageKey = DEFAULT_STORAGE_KEY,
}: PrizeWheelScreenProps) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const [draft, setDraft] = useState(() => loadInitialDraft(storageKey));
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const prizes = useMemo(() => normalizePrizeEntries(draft), [draft]);
  const segments = useMemo(() => buildPrizeSegments(prizes), [prizes]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(prizes));
  }, [prizes, storageKey]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const handlePrizeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      setResultLabel(null);
    },
    [],
  );

  const handleClear = useCallback(() => {
    setDraft('');
    setResultLabel(null);
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setDraft(DEFAULT_PRIZES.join('\n'));
    setResultLabel(null);
  }, []);

  const handleSpin = useCallback(() => {
    if (isSpinning || prizes.length === 0) {
      return;
    }

    const spin = choosePrizeSegment(prizes, rng ?? Math.random, rotation);

    if (!spin) {
      return;
    }

    setResultLabel(null);
    setIsSpinning(true);
    setRotation(spin.targetRotation);

    timeoutRef.current = window.setTimeout(() => {
      setResultLabel(spin.segment.label);
      setIsSpinning(false);
      timeoutRef.current = undefined;
    }, spinDurationMs);
  }, [isSpinning, prizes, rng, rotation, spinDurationMs]);

  const wheelStyle = {
    '--wheel-center-rotation': `${-rotation}deg`,
    '--wheel-rotation': `${rotation}deg`,
    background: getWheelBackground(segments),
  } satisfies WheelStyle;

  return (
    <main className="prize-wheel-screen">
      <header className="prize-wheel-topbar">
        <div className="prize-wheel-brand">
          <img src="/v4logo.png" alt="V4 Company" />
          <span>Roleta de premios</span>
        </div>
      </header>

      <section className="prize-wheel-layout" aria-labelledby="wheel-title">
        <div className="prize-wheel-stage">
          <div className="prize-wheel-pointer" aria-hidden="true" />
          <div
            className="prize-wheel-disc"
            data-segment-count={segments.length}
            style={wheelStyle}
          >
            {segments.map((segment) => (
              <WheelSegmentLabel key={segment.id} segment={segment} />
            ))}
            <div className="prize-wheel-center" aria-hidden="true">
              <img src="/v4logo.png" alt="" />
            </div>
          </div>

          <button
            className="prize-wheel-spin-button"
            disabled={isSpinning || prizes.length === 0}
            onClick={handleSpin}
            type="button"
          >
            Girar roleta
          </button>

          <p
            aria-atomic="true"
            aria-live="polite"
            className="prize-wheel-result"
            role="status"
          >
            {resultLabel
              ? `Premio sorteado: ${resultLabel}`
              : 'Aguardando giro.'}
          </p>
        </div>

        <aside className="prize-wheel-editor" aria-labelledby="wheel-title">
          <div className="prize-wheel-editor-heading">
            <div>
              <p className="prize-wheel-eyebrow">V4 Alfradique</p>
              <h1 id="wheel-title">Roleta de premios</h1>
            </div>
            <span className="prize-wheel-count">premios: {prizes.length}</span>
          </div>

          <div className="prize-wheel-toolbar" aria-label="Acoes da lista">
            <button onClick={handleRestoreDefaults} type="button">
              <RotateCcw aria-hidden="true" size={18} />
              <span>Exemplos</span>
            </button>
            <button onClick={handleClear} type="button">
              <Trash2 aria-hidden="true" size={18} />
              <span>Limpar</span>
            </button>
          </div>

          <label className="prize-wheel-input-label" htmlFor="prize-list">
            Premios da roleta
          </label>
          <textarea
            className="prize-wheel-textarea"
            disabled={isSpinning}
            id="prize-list"
            onChange={handlePrizeChange}
            placeholder="Digite ou cole seus premios aqui"
            spellCheck={false}
            value={draft}
          />
        </aside>
      </section>
    </main>
  );
}

function WheelSegmentLabel({ segment }: { readonly segment: PrizeSegment }) {
  const style = {
    '--label-font-size': getPrizeLabelFontSize(segment.label),
    '--segment-angle': `${segment.middleAngle}deg`,
    '--segment-count': Math.max(1, segment.colorIndex + 1),
    color: getLabelColor(segment.colorIndex),
  } satisfies SegmentLabelStyle;

  return (
    <span className="prize-wheel-label" style={style}>
      <span>{segment.label}</span>
    </span>
  );
}

function loadInitialDraft(storageKey: string): string {
  const storedValue = window.localStorage.getItem(storageKey);

  if (!storedValue) {
    return DEFAULT_PRIZES.join('\n');
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (isStringArray(parsedValue)) {
      return parsedValue.join('\n');
    }
  } catch {
    return DEFAULT_PRIZES.join('\n');
  }

  return DEFAULT_PRIZES.join('\n');
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function getWheelBackground(segments: readonly PrizeSegment[]): string {
  if (segments.length === 0) {
    return '#f1f1f4';
  }

  const stops = segments.map((segment) => {
    const color = WHEEL_COLORS[segment.colorIndex % WHEEL_COLORS.length];

    return `${color} ${formatAngle(segment.startAngle)}deg ${formatAngle(
      segment.endAngle,
    )}deg`;
  });

  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
}

function getLabelColor(index: number): string {
  const color = WHEEL_COLORS[index % WHEEL_COLORS.length];

  return color === '#ffffff' || color === '#f2f2f2' ? '#111111' : '#ffffff';
}

function formatAngle(angle: number): string {
  return Number.isInteger(angle) ? String(angle) : angle.toFixed(4);
}
