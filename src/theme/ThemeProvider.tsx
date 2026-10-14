import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
type ThemeContextValue = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};
const STORAGE_KEY = 'apcosys-theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);
let transitionTimer: number | undefined;

function endThemeTransition() {
  if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
  transitionTimer = undefined;
  delete document.documentElement.dataset.themeTransition;
}

function validMode(value: string | undefined | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}
function systemTheme(): ResolvedTheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function resolved(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? systemTheme() : mode;
}
function applyDomTheme(mode: ThemeMode, theme: ResolvedTheme, animate: boolean) {
  const html = document.documentElement;
  endThemeTransition();
  if (animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    html.dataset.themeTransition = '';
    transitionTimer = window.setTimeout(endThemeTransition, 260);
  }
  html.dataset.themeMode = mode;
  html.dataset.theme = theme;
  html.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0D1113' : '#03879F';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const rawMode = document.documentElement.dataset.themeMode;
  const initialMode: ThemeMode = validMode(rawMode) ? rawMode : 'system';
  const initialTheme: ResolvedTheme =
    document.documentElement.dataset.theme === 'dark' ? 'dark' : resolved(initialMode);
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [theme, setTheme] = useState<ResolvedTheme>(initialTheme);

  useEffect(() => () => endThemeTransition(), []);

  const setMode = useCallback((next: ThemeMode) => {
    const nextTheme = resolved(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private/strict storage */
    }
    setModeState(next);
    setTheme(nextTheme);
    applyDomTheme(next, nextTheme, true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (mode !== 'system') return;
      const next: ResolvedTheme = query.matches ? 'dark' : 'light';
      setTheme(next);
      applyDomTheme('system', next, true);
    };
    query.addEventListener?.('change', onSystemChange);
    return () => query.removeEventListener?.('change', onSystemChange);
  }, [mode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !validMode(event.newValue)) return;
      const nextTheme = resolved(event.newValue);
      setModeState(event.newValue);
      setTheme(nextTheme);
      applyDomTheme(event.newValue, nextTheme, true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ mode, theme, setMode }), [mode, theme, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
