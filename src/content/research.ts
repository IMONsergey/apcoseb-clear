export type ResearchScene = 'query' | 'results' | 'host' | 'evidence' | 'suggestions';
export const researchSteps = [
  {
    title: 'Query.',
    scene: 'query',
    description: 'Search internet-facing hosts, services and technologies.',
    alt: 'Search workspace with a query field and supported query types.',
  },
  {
    title: 'Results.',
    scene: 'results',
    description: 'Matching hosts with their open ports and services.',
    alt: 'Illustrative list of matching hosts, services and technologies.',
  },
  {
    title: 'Host.',
    scene: 'host',
    description: 'Open ports, services and detected products of a single host.',
    alt: 'Illustrative host details and open services.',
  },
  {
    title: 'Technical context.',
    scene: 'evidence',
    description: 'Review the service response, certificate and observed technical context.',
    alt: 'Host TLS certificate with its issuer, validity period and DNS name.',
  },
  {
    title: 'Next step.',
    scene: 'suggestions',
    description: 'Refine the query with what you found and continue.',
    alt: 'Return to the query with a more specific search.',
  },
] as const satisfies ReadonlyArray<{
  title: string;
  scene: ResearchScene;
  description: string;
  alt: string;
}>;
