import type { LegalDocuments } from '../content/legal-types';
import type { Locale } from './messages';

const loaders: Record<Locale, () => Promise<{ default: LegalDocuments }>> = {
  en: () => import('../content/legal-documents.json'),
  ru: () => import('../content/legal-translations/ru.json'),
  'zh-Hant': () => import('../content/legal-translations/zh-Hant.json'),
};
const pending = new Map<Locale, Promise<LegalDocuments>>();

/** Each locale has a separate document chunk; never render an English fallback body. */
export function loadLegalDocuments(locale: Locale): Promise<LegalDocuments> {
  let request = pending.get(locale);
  if (!request) {
    request = loaders[locale]().then((module) => module.default);
    pending.set(locale, request);
    void request.catch(() => pending.delete(locale));
  }
  return request;
}
