export type ResearchScene = 'query' | 'results' | 'host' | 'evidence' | 'suggestions';
export const researchSteps = [
  {
    title: 'Query.',
    scene: 'query',
    description: 'Search internet-facing hosts, services and technologies.',
    image: 'step-query.webp',
    alt: 'Search query with recent queries and syntax examples.',
  },
  {
    title: 'Results.',
    scene: 'results',
    description: 'Matching hosts with their open ports and services.',
    image: 'step-results.webp',
    alt: 'Illustrative list of matching hosts, services and technologies.',
  },
  {
    title: 'Host.',
    scene: 'host',
    description: 'Open ports, services and detected products of a single host.',
    image: 'step-host.webp',
    alt: 'Illustrative host details and open services.',
  },
  {
    title: 'Technical context.',
    scene: 'evidence',
    description: 'Detected products, versions and CVEs potentially associated with them.',
    image: 'step-host.webp',
    alt: 'Illustrative technical context for an individual host.',
  },
  {
    title: 'Next step.',
    scene: 'suggestions',
    description: 'Refine the query with what you found and continue.',
    image: 'step-query.webp',
    alt: 'Return to the query with a more specific search.',
  },
] as const satisfies ReadonlyArray<{
  title: string;
  scene: ResearchScene;
  description: string;
  image: string;
  alt: string;
}>;
export type ResearchPoster = (typeof researchSteps)[number]['image'];
