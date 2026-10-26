const paths = {
  plus: 'M12 5v14M5 12h14',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2',
  search: 'm16 16 4 4M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  close: 'm6 6 12 12M18 6 6 18',
  server:
    'M5 3h14a2 2 0 0 1 2 2v5H3V5a2 2 0 0 1 2-2Zm-2 7v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M7 6h1M7 15h1',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  key: 'M14 3a7 7 0 1 1-5 12L3 21H1v-4l6-6a7 7 0 0 1 7-8Zm2 4h.01',
  copy: 'M9 8h11v13H9V8ZM5 16H3V3h11v2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  lock: 'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4',
  refresh: 'M20 7A9 9 0 0 0 5 5L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5',
  chart: 'M4 21V12h4v9M10 21V3h4v18M16 21V8h4v13',
  check: 'm5 12 4 4L19 6',
  cube: 'm12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12v10M12 12 3 7',
  list: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
} as const;

/** Small line icons shared by the inert application excerpts. */
export function ApplicationGlyph({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="application-glyph"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
