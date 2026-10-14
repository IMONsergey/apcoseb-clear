import type { SVGProps } from 'react';
export type IconName =
  | 'arrow'
  | 'down'
  | 'chevron'
  | 'search'
  | 'plus'
  | 'minus'
  | 'close'
  | 'menu'
  | 'previous'
  | 'external'
  | 'focus'
  | 'pause'
  | 'play'
  | 'database'
  | 'scanner'
  | 'cube'
  | 'book'
  | 'bookmark'
  | 'appearance';
const paths: Record<IconName, string> = {
  arrow: 'M3 8h10M8 3l5 5-5 5',
  down: 'M8 3v10M3 8l5 5 5-5',
  chevron: 'M4 6l4 4 4-4',
  search: 'm11.4 11.4 3.2 3.2M12.5 7A5.5 5.5 0 1 1 1.5 7a5.5 5.5 0 0 1 11 0',
  plus: 'M3 8h10M8 3v10',
  minus: 'M3 8h10',
  close: 'm4 4 8 8M12 4l-8 8',
  menu: 'M2 4h12M2 8h12M2 12h12',
  previous: 'M13 8H3M8 3 3 8l5 5',
  external: 'M4 12 12 4M4 4h8v8',
  focus: 'M1 5V1h4m6 0h4v4m0 6v4h-4m-6 0H1v-4',
  database: 'M2 4c0-3 12-3 12 0s-12 3-12 0v8c0 3 12 3 12 0V4M2 8c0 3 12 3 12 0',
  scanner: 'M2 2h9a3 3 0 0 1 3 3v9M1 6a9 9 0 0 1 9 9M1 10a5 5 0 0 1 5 5M1 14h1',
  cube: 'm8 1 6 3.5v7L8 15l-6-3.5v-7L8 1Zm0 7 6-3.5M8 8v7M8 8 2 4.5',
  book: 'M8 3C6 1 2 1 1 2v12c2-1 5-1 7 1 2-2 5-2 7-1V2c-1-1-5-1-7 1Zm0 0v12',
  bookmark: 'M3 2h10v13l-5-3-5 3V2Z',
  appearance: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 0v11M8 5a3 3 0 0 0 0 6',
  pause: 'M5 3v10M11 3v10',
  play: 'm5 3 8 5-8 5Z',
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
