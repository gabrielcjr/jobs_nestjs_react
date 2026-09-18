import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';
import { THEME_STORAGE_KEY } from '../config/theme.config';

const TestComponent = () => {
  const { activePalette, activePaletteId, setPalette, availablePalettes, resetToDefault } = useTheme();
  return (
    <div>
      <span data-testid="current-palette-id">{activePaletteId}</span>
      <span data-testid="current-palette-name">{activePalette.name}</span>
      <button onClick={() => setPalette('emerald-jade')}>Select Emerald</button>
      <button onClick={() => setPalette('electric-cyan')}>Select Cyan</button>
      <button onClick={() => setPalette('solar-amber')}>Select Amber</button>
      <button onClick={() => setPalette('neon-rose')}>Select Rose</button>
      <button onClick={resetToDefault}>Reset Theme</button>
      <span data-testid="palettes-count">{availablePalettes.length}</span>
    </div>
  );
};

describe('ThemeContext & ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('renders default electric-cyan palette on initial load', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('electric-cyan');
    expect(screen.getByTestId('current-palette-name')).toHaveTextContent('Electric Cyan');
    expect(document.documentElement.getAttribute('data-theme')).toBe('electric-cyan');
    expect(screen.getByTestId('palettes-count')).toHaveTextContent('5');
  });

  it('changes active palette, updates document data-theme and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Select Emerald' }));

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('emerald-jade');
    expect(screen.getByTestId('current-palette-name')).toHaveTextContent('Emerald Jade');
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald-jade');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('emerald-jade');

    await user.click(screen.getByRole('button', { name: 'Select Rose' }));

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('neon-rose');
    expect(document.documentElement.getAttribute('data-theme')).toBe('neon-rose');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('neon-rose');
  });

  it('initializes from localStorage if saved preference exists', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'electric-cyan');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('electric-cyan');
    expect(screen.getByTestId('current-palette-name')).toHaveTextContent('Electric Cyan');
    expect(document.documentElement.getAttribute('data-theme')).toBe('electric-cyan');
  });

  it('resets to default palette and clears storage on resetToDefault', async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_STORAGE_KEY, 'solar-amber');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('solar-amber');

    await user.click(screen.getByRole('button', { name: 'Reset Theme' }));

    expect(screen.getByTestId('current-palette-id')).toHaveTextContent('electric-cyan');
    expect(document.documentElement.getAttribute('data-theme')).toBe('electric-cyan');
  });
});
