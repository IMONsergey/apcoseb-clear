/** Published HTTP contract: https://apcosys.net/docs/api. No request runs in this demo. */
export const apiRequestExample = [
  'curl --request POST "https://api.apcosys.net/api/v1/search/hosts" \\',
  '  --header "X-API-Key: $APCOSYS_API_KEY" \\',
  '  --header "Content-Type: application/json" \\',
  '  --data \'{"page":1,"docs_per_page":20,"full_text_search":"nginx"}\'',
].join('\n');

/** Documented response shape with reserved example addresses and synthetic values. */
export const apiResponseExample = JSON.stringify(
  {
    total: 1,
    page: 1,
    docs_per_page: 20,
    hosts: [
      {
        ip: '203.0.113.10',
        org: 'Example Research Network',
        country_code: 'US',
        uts: 1792768164,
        open_ports: [{ protocol: 'https', port: 443 }],
      },
    ],
  },
  null,
  2,
);
