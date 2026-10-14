import AboutPage from './corporate/AboutPage';
import ScanningPage from './corporate/ScanningPage';
import ContactPage from './corporate/ContactPage';
export default function CorporatePages({ path }: { path: string }) {
  if (path === '/about') return <AboutPage />;
  if (path === '/responsible-scanning') return <ScanningPage />;
  return <ContactPage />;
}
