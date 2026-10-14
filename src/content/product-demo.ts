/** Authored, synthetic fixtures. Documentation addresses are never claimed as scanned assets. */
export type EvidenceScenario = 'domain' | 'indicator' | 'technology';
export type DemoHost = {
  ip: string;
  hostname: string;
  role: string;
  services: { port: string; protocol: string; technology: string; evidence: string }[];
};
export const demoHosts: DemoHost[] = [
  {
    ip: '198.51.100.24',
    hostname: 'portal.example.com',
    role: 'Web application',
    services: [
      {
        port: '443',
        protocol: 'HTTPS',
        technology: 'nginx 1.24.0',
        evidence: 'HTTP Server header',
      },
      { port: '80', protocol: 'HTTP', technology: 'HTTPS redirect', evidence: '301 response' },
    ],
  },
  {
    ip: '203.0.113.42',
    hostname: 'gateway.example.com',
    role: 'Access gateway',
    services: [
      {
        port: '443',
        protocol: 'HTTPS',
        technology: 'nginx 1.24.0',
        evidence: 'HTTP Server header',
      },
      {
        port: '22',
        protocol: 'SSH',
        technology: 'OpenSSH 9.6',
        evidence: 'SSH identification banner',
      },
    ],
  },
];
export const demoScenarios: Record<
  EvidenceScenario,
  { label: string; query: string; description: string; hosts: DemoHost[]; next: string }
> = {
  domain: {
    label: 'Domain',
    query: 'example.com',
    description: 'Illustrative domain investigation',
    hosts: demoHosts,
    next: 'Check the selected hostname against the programme’s permitted scope.',
  },
  technology: {
    label: 'Technology',
    query: 'nginx 1.24.0',
    description: 'Illustrative technology investigation',
    hosts: [demoHosts[1]!, demoHosts[0]!],
    next: 'Compare the detected version with vendor advisories and installed patches.',
  },
  indicator: {
    label: 'IP address',
    query: '198.51.100.24',
    description: 'Illustrative indicator lookup',
    hosts: [demoHosts[0]!],
    next: 'Use the HTTPS service or hostname as a new lead. Shared attributes do not establish ownership.',
  },
};
export const demoNotice =
  'Synthetic demonstration. Reserved example addresses and authored service records; no live scan or CVE finding.';
export const apiRequestExample =
  'curl --request GET "$APCOSYS_API_ENDPOINT" \\\n  --header "$APCOSYS_AUTH_HEADER: $APCOSYS_API_KEY"';
export const apiResponseExample = JSON.stringify(
  {
    note: 'Illustrative response shape only',
    host: demoHosts[0]!.ip,
    services: demoHosts[0]!.services.map(({ port, protocol, technology }) => ({
      port: Number(port),
      protocol,
      technology,
    })),
  },
  null,
  2,
);
