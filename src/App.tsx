import { RouteReady } from './app/RouteReady';
import { Suspense, lazy } from 'react';
import { useLocale } from './i18n/context';
import { LocaleText } from './i18n/LocaleText';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MotionProvider } from './components/visuals/MotionProvider';
import { RouteBoundary } from './app/RouteBoundary';
import { useSiteRoute } from './app/router';

import {
  loadHome,
  loadPlatform,
  loadResearch,
  loadCommercial,
  loadCorporate,
  loadLegal,
  loadNotFound,
  routeGroup,
} from './app/routeModules';
import './styles/route-transitions.css';
const pages = {
  home: lazy(loadHome),
  platform: lazy(loadPlatform),
  research: lazy(loadResearch),
  commercial: lazy(loadCommercial),
  corporate: lazy(loadCorporate),
  legal: lazy(loadLegal),
  notFound: lazy(loadNotFound),
};

export function App() {
  const { locale, t } = useLocale();
  const path = useSiteRoute();
  const Page = pages[routeGroup(path)];
  return (
    <MotionProvider>
      <div id="top" className="site" lang={locale}>
        <a href="#main" className="skip-link">
          <LocaleText>{t('Skip to content')}</LocaleText>
        </a>
        <Header />
        <main id="main" data-route={path}>
          <RouteBoundary key={path}>
            <Suspense
              fallback={
                <div className="route-fallback" role="status" aria-label="Loading page">
                  <span className="sr-only">Loading page…</span>
                </div>
              }
            >
              <RouteReady path={path}>
                <Page path={path} />
              </RouteReady>
            </Suspense>
          </RouteBoundary>
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
