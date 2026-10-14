import '../styles/workspaces.css';
import InvestigationPage from './platform/InvestigationPage';
import MethodologyPage from './platform/MethodologyPage';
import MonitoringPage from './platform/MonitoringPage';
export default function PlatformPages({ path }: { path: string }) {
  if (path === '/platform/search-investigation') return <InvestigationPage />;
  if (path === '/platform/data-methodology') return <MethodologyPage />;
  return <MonitoringPage />;
}
