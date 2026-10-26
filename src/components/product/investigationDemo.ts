import { demoHosts, type DemoHost } from '../../content/product-demo';

export type InvestigationStory = 'search' | 'bounty' | 'vulnerability' | 'osint' | 'team';
export type InvestigationStep = 0 | 1 | 2;
export type InvestigationDetail = 'response' | 'tls';

export const investigationStories = {
  search: {
    tag: 'SEARCH & INVESTIGATION',
    heading: 'From query to technical context.',
    context: 'Try a query, open a host and inspect its services in this interactive example.',
    query: 'example.com',
  },
  bounty: {
    tag: 'AUTHORISED BUG BOUNTY',
    heading: 'Stay inside the programme scope.',
    context: 'Follow a reserved example domain through scope checks and host evidence.',
    query: 'example.com',
  },
  vulnerability: {
    tag: 'VULNERABILITY RESEARCH',
    heading: 'Technology signals need verification.',
    context: 'Find an example technology and inspect the response behind its detected version.',
    query: 'nginx 1.24.0',
  },
  osint: {
    tag: 'OSINT & THREAT INVESTIGATION',
    heading: 'Follow an indicator, not an assumption.',
    context: 'Follow a reserved example address through services and shared attributes.',
    query: '198.51.100.24',
  },
  team: {
    tag: 'SECURITY TEAM WORKFLOW',
    heading: 'From analyst question to technical context.',
    context: 'Review an example host and plan the next investigation step.',
    query: '203.0.113.42',
  },
} as const;

export const investigationExamples = ['example.com', 'nginx 1.24.0', '198.51.100.24'] as const;

export const investigationLocations: Record<string, string> = {
  '198.51.100.24': 'Germany',
  '203.0.113.42': 'Netherlands',
};

export function findInvestigationHosts(query: string): DemoHost[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return demoHosts.filter((host) => {
    const attributes = [
      host.ip,
      host.hostname,
      ...host.services.flatMap((service) => [service.port, service.protocol, service.technology]),
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => attributes.includes(term));
  });
}

export type InvestigationState = {
  step: InvestigationStep;
  draft: string;
  query: string;
  hostIp: string;
  port: string;
  detail: InvestigationDetail;
};

export function initialInvestigationState(
  story: InvestigationStory,
  demoHost?: string | null,
): InvestigationState {
  const linkedHost = demoHosts.find((host) => host.ip === demoHost);
  const query = linkedHost?.hostname ?? investigationStories[story].query;
  const host = linkedHost ?? findInvestigationHosts(query)[0] ?? demoHosts[0]!;
  return {
    step: linkedHost ? 2 : 0,
    draft: query,
    query,
    hostIp: host.ip,
    port: host.services[0]!.port,
    detail: 'response',
  };
}

export type InvestigationAction =
  | { type: 'draft'; value: string }
  | { type: 'query'; value: string }
  | { type: 'step'; value: InvestigationStep }
  | { type: 'host'; value: string }
  | { type: 'service'; value: string }
  | { type: 'detail'; value: InvestigationDetail }
  | { type: 'refine' };

export function investigationReducer(
  state: InvestigationState,
  action: InvestigationAction,
): InvestigationState {
  const host = demoHosts.find((candidate) => candidate.ip === state.hostIp)!;
  switch (action.type) {
    case 'draft':
      return { ...state, draft: action.value };
    case 'query': {
      const query = action.value.trim();
      const matches = findInvestigationHosts(query);
      const nextHost = matches.find((candidate) => candidate.ip === state.hostIp) ?? matches[0];
      return {
        ...state,
        step: 1,
        query,
        draft: query,
        hostIp: nextHost?.ip ?? state.hostIp,
        port: nextHost?.services[0]!.port ?? state.port,
        detail: 'response',
      };
    }
    case 'step':
      return action.value === 2 && !findInvestigationHosts(state.query).length
        ? state
        : { ...state, step: action.value };
    case 'host': {
      const nextHost = findInvestigationHosts(state.query).find(
        (candidate) => candidate.ip === action.value,
      );
      return nextHost
        ? {
            ...state,
            step: 2,
            hostIp: nextHost.ip,
            port: nextHost.services[0]!.port,
            detail: 'response',
          }
        : state;
    }
    case 'service': {
      const service = host.services.find((candidate) => candidate.port === action.value);
      return service ? { ...state, port: service.port, detail: 'response' } : state;
    }
    case 'detail':
      return action.value === 'tls' &&
        host.services.find((service) => service.port === state.port)?.protocol !== 'HTTPS'
        ? state
        : { ...state, detail: action.value };
    case 'refine':
      return investigationReducer(state, { type: 'query', value: host.hostname });
  }
}

export function investigationResponse(host: DemoHost, port: string): string {
  const service = host.services.find((candidate) => candidate.port === port)!;
  if (service.protocol === 'SSH') return 'SSH-2.0-OpenSSH_9.6';
  if (service.protocol === 'HTTP')
    return `HTTP/1.1 301 Moved Permanently\nLocation: https://${host.hostname}/`;
  return 'HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html; charset=utf-8';
}
