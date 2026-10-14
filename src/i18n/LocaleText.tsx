import { typograph } from './typography';
export function LocaleText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={['locale-text', className].filter(Boolean).join(' ')} lang="en">
      {typograph(children)}
    </span>
  );
}
