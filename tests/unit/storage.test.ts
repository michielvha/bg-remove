import { afterEach, describe, expect, it } from 'vitest';
import { loadTheme, saveTheme } from '../../src/utils/storage';

describe('storage util (AC13)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to dark when nothing is stored', () => {
    expect(loadTheme()).toBe('dark');
  });

  it('defaults to dark when the stored value is invalid', () => {
    localStorage.setItem('theme', 'banana');
    expect(loadTheme()).toBe('dark');
  });

  it('round-trips a saved theme', () => {
    saveTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(loadTheme()).toBe('light');

    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });
});
