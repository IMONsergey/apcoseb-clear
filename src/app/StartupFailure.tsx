import { localeHref, resolveSiteLocation } from './paths';
import type { Locale } from '../i18n/messages';

// Deliberately bundled with the entry: the normal translation chunk may be unavailable.
const copy = {
  en: {
    title: 'This page could not load.',
    description: 'Check your connection and reload the page to try again.',
    reload: 'Reload page',
    english: 'Continue in English',
  },
  ru: {
    title: 'Не удалось загрузить страницу.',
    description:
      'Проверьте подключение и перезагрузите страницу. Можно также открыть английскую версию.',
    reload: 'Перезагрузить страницу',
    english: 'Открыть английскую версию',
  },
  'zh-Hant': {
    title: '無法載入此頁面。',
    description: '請檢查網路連線並重新載入頁面，或開啟英文版本。',
    reload: '重新載入頁面',
    english: '開啟英文版本',
  },
} satisfies Record<Locale, { title: string; description: string; reload: string; english: string }>;

export function StartupFailure({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const route = resolveSiteLocation(location.pathname)?.routePath ?? '/';
  const englishHref =
    localeHref(route + location.search + location.hash, 'en') ?? localeHref('/', 'en')!;
  return (
    <main className="container route-error" data-startup-error="" role="alert" lang={locale}>
      <h1>{text.title}</h1>
      <p>{text.description}</p>
      <button type="button" className="plain-button" onClick={() => location.reload()}>
        {text.reload}
      </button>
      {locale !== 'en' && (
        <p>
          <a href={englishHref}>{text.english}</a>
        </p>
      )}
    </main>
  );
}
