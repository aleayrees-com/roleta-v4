import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PrizeWheelScreen } from './PrizeWheelScreen.js';

const storageKey = 'v4-prize-wheel-test';

describe('PrizeWheelScreen', () => {
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  test('loads prizes saved in localStorage', () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(['Pix surpresa', 'Jantar']),
    );

    render(<PrizeWheelScreen storageKey={storageKey} />);

    expect(screen.getByLabelText('Premios da roleta')).toHaveValue(
      'Pix surpresa\nJantar',
    );
    expect(screen.getByText('premios: 2')).toBeInTheDocument();
  });

  test('saves manual prizes and updates the wheel count', async () => {
    const user = userEvent.setup();

    render(<PrizeWheelScreen storageKey={storageKey} />);

    await user.clear(screen.getByLabelText('Premios da roleta'));
    await user.type(
      screen.getByLabelText('Premios da roleta'),
      'Pix surpresa\n\nJantar\nMentoria',
    );

    expect(screen.getByText('premios: 3')).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).toBe(
      JSON.stringify(['Pix surpresa', 'Jantar', 'Mentoria']),
    );
  });

  test('applies a smaller label font size for longer prize names', () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(['Vale R$ 500', 'Jantar']),
    );

    render(<PrizeWheelScreen storageKey={storageKey} />);

    expect(
      screen.getByText('Vale R$ 500').closest('.prize-wheel-label'),
    ).toHaveStyle('--label-font-size: clamp(0.88rem, 1.85vw, 1.95rem)');
    expect(
      screen.getByText('Jantar').closest('.prize-wheel-label'),
    ).toHaveStyle('--label-font-size: clamp(1rem, 2.25vw, 2.5rem)');
  });

  test('spins once, blocks duplicate clicks, and announces the prize', async () => {
    vi.useFakeTimers();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(['Pix surpresa', 'Jantar', 'Mentoria']),
    );

    render(
      <PrizeWheelScreen
        rng={() => 0.52}
        spinDurationMs={300}
        storageKey={storageKey}
      />,
    );

    const spinButton = screen.getByRole('button', { name: 'Girar roleta' });

    fireEvent.click(spinButton);

    expect(spinButton).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(spinButton).not.toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Premio sorteado: Jantar',
    );
  });
});
