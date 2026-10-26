import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findInvestigationHosts,
  initialInvestigationState,
  investigationReducer,
  investigationResponse,
  type InvestigationStory,
} from '../../src/components/product/investigationDemo.ts';
import { demoHosts } from '../../src/content/product-demo.ts';

for (const [story, query, expectedHosts] of [
  ['search', 'example.com', ['198.51.100.24', '203.0.113.42']],
  ['bounty', 'example.com', ['198.51.100.24', '203.0.113.42']],
  ['vulnerability', 'nginx 1.24.0', ['198.51.100.24', '203.0.113.42']],
  ['osint', '198.51.100.24', ['198.51.100.24']],
  ['team', '203.0.113.42', ['203.0.113.42']],
] as const) {
  test(`${story} starts with its own query and refines the selected host`, () => {
    let state = initialInvestigationState(story);
    assert.equal(state.query, query);
    const matches = findInvestigationHosts(state.query);
    assert.deepEqual(
      matches.map((host) => host.ip),
      [...expectedHosts],
    );
    const lastHost = matches.at(-1)!;
    state = investigationReducer(state, { type: 'host', value: lastHost.ip });
    assert.equal(state.hostIp, lastHost.ip);
    state = investigationReducer(state, { type: 'refine' });
    assert.equal(state.step, 1);
    assert.equal(state.query, lastHost.hostname);
    assert.deepEqual(
      findInvestigationHosts(state.query).map((host) => host.ip),
      [lastHost.ip],
    );
  });
}

test('a valid monitoring deep link opens its host for every story; unknown addresses are ignored', () => {
  for (const story of [
    'search',
    'bounty',
    'vulnerability',
    'osint',
    'team',
  ] as InvestigationStory[]) {
    for (const host of demoHosts) {
      const state = initialInvestigationState(story, host.ip);
      assert.equal(state.step, 2);
      assert.equal(state.hostIp, host.ip);
      assert.deepEqual(
        findInvestigationHosts(state.query).map((match) => match.ip),
        [host.ip],
      );
    }
    assert.deepEqual(
      initialInvestigationState(story, '192.0.2.100'),
      initialInvestigationState(story),
    );
  }
});

test('example search handles case, whitespace and misses without presenting a stale host', () => {
  assert.equal(findInvestigationHosts('  NGINX   1.24.0 ').length, 2);
  assert.deepEqual(
    findInvestigationHosts('gateway.example.com').map((host) => host.ip),
    ['203.0.113.42'],
  );
  assert.deepEqual(findInvestigationHosts(''), []);
  assert.deepEqual(findInvestigationHosts('unlisted.example.net'), []);
  const empty = investigationReducer(initialInvestigationState('search'), {
    type: 'query',
    value: 'unlisted.example.net',
  });
  assert.equal(empty.step, 1);
  assert.equal(investigationReducer(empty, { type: 'step', value: 2 }).step, 1);
  assert.equal(investigationReducer(empty, { type: 'host', value: '198.51.100.24' }).step, 1);
});

test('service evidence follows the selected port and TLS never remains attached to HTTP or SSH', () => {
  let state = initialInvestigationState('team');
  state = investigationReducer(state, { type: 'detail', value: 'tls' });
  assert.equal(state.detail, 'tls');
  state = investigationReducer(state, { type: 'service', value: '22' });
  assert.equal(state.detail, 'response');
  assert.equal(investigationReducer(state, { type: 'detail', value: 'tls' }).detail, 'response');
  assert.equal(investigationResponse(demoHosts[1]!, state.port), 'SSH-2.0-OpenSSH_9.6');
  assert.match(
    investigationResponse(demoHosts[0]!, '80'),
    /Location: https:\/\/portal\.example\.com\//,
  );
  assert.match(investigationResponse(demoHosts[0]!, '443'), /Server: nginx\/1\.24\.0/);
});
