import { siteHref } from '../app/paths';
import { useLocale } from '../i18n/context';
import Arcade404 from './Arcade404';
import '../styles/arcade-404.css';

export default function NotFoundPage() {
  const { t } = useLocale();

  return (
    <section className="arcade404-page" aria-labelledby="arcade404-title">
      <header className="arcade404-header">
        <h1 id="arcade404-title">
          <span aria-hidden="true">404</span>
          <span className="arcade404-header__separator" aria-hidden="true">
            /
          </span>
          {t('Page not found')}
        </h1>
        <a className="arcade404-home" href={siteHref('/')}>
          {t('Return to home')}
          <span aria-hidden="true">↗</span>
        </a>
      </header>
      <Arcade404 />
    </section>
  );
}
