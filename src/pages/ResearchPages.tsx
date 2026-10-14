import '../styles/workspaces.css';
import '../styles/research-scenarios.css';
import TeamPage from './research/TeamPage';
import UseCasePage from './research/UseCasePage';
export default function ResearchPages({ path }: { path: string }) {
  return path === '/teams' ? <TeamPage /> : <UseCasePage path={path} />;
}
