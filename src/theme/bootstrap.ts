/** Runs synchronously in the document head before styles or application modules load. */
(() => {
  type ThemeMode = 'system' | 'light' | 'dark';
  let mode: ThemeMode = 'system';
  try {
    const stored = localStorage.getItem('apcosys-theme-mode');
    if (stored === 'light' || stored === 'dark' || stored === 'system') mode = stored;
  } catch {
    // Restricted storage falls back to the operating system preference.
  }
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const root = document.documentElement;
  root.dataset.themeMode = mode;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0D1113' : '#03879F';
})();
