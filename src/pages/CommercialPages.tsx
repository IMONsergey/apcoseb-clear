import '../styles/product-motion.css';
import PricingPage from './commercial/PricingPage';
import ApiPage from './commercial/ApiPage';
export default function CommercialPages({ path }: { path: string }) {
  return path === '/pricing' ? <PricingPage /> : <ApiPage />;
}
