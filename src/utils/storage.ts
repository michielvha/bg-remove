type ThemeMode = 'light' | 'dark';

export function loadTheme(): ThemeMode {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  // Default to dark
  return 'dark';
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem('theme', theme);
}

