import { siteHref } from '../app/paths';
import { useLocale } from '../i18n/context';
import Arcade404 from './Arcade404';
import { DoubleButton } from '../components/ui/DoubleButton';
import '../styles/arcade-404.css';

export default function NotFoundPage() {
  const { t } = useLocale();

  return (
    <section className="arcade404-page" aria-labelledby="arcade404-title">
      <header className="arcade404-header">
        <h1 id="arcade404-title">{t('Page not found')}</h1>
        <DoubleButton href={siteHref('/')} className="arcade404-home">
          {t('Return to home')}
        </DoubleButton>
      </header>
      <Arcade404 />
    </section>
  );
}
