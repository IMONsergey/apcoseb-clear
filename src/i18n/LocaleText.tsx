import { useLocale } from './context';

export function LocaleText({ children, className = '' }: { children: string; className?: string }) {
  const { locale, t } = useLocale();
  return (
    <span className={['locale-text', className].filter(Boolean).join(' ')} lang={locale}>
      {t(children)}
    </span>
  );
}
