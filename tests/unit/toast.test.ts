import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '../../src/utils/toast';

describe('toast util (AC12)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    // Note: document.head is intentionally NOT cleared. The slideOut <style> is
    // injected once via a module-level guard; wiping head would mask that.
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const slideOutStyles = () =>
    [...document.head.querySelectorAll('style')].filter((s) =>
      s.textContent?.includes('@keyframes slideOut'),
    );

  it('renders the message with a type-specific class', () => {
    showToast('Saved!', 'success');
    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Saved!');
    expect(toast?.classList.contains('toast-success')).toBe(true);
  });

  it('defaults to the success type', () => {
    showToast('Default');
    expect(document.querySelector('.toast')?.classList.contains('toast-success')).toBe(true);
  });

  it('replaces an existing toast instead of stacking', () => {
    showToast('First', 'success');
    showToast('Second', 'error');
    const toasts = document.querySelectorAll('.toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.textContent).toBe('Second');
    expect(toasts[0]?.classList.contains('toast-error')).toBe(true);
  });

  it('injects the slideOut keyframes only once', () => {
    showToast('a');
    showToast('b');
    showToast('c');
    expect(slideOutStyles()).toHaveLength(1);
  });

  it('auto-dismisses the toast after the timeout', () => {
    showToast('Bye');
    expect(document.querySelector('.toast')).not.toBeNull();
    vi.advanceTimersByTime(3000 + 300);
    expect(document.querySelector('.toast')).toBeNull();
  });
});
