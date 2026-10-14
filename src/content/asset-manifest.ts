export default {
  groups: {
    brand: {
      directory: 'assets/brand',
      files: ['favicon.svg', 'logo.svg'],
    },
    api: {
      directory: 'assets/illustrations/api',
      files: ['api-layers.webp', 'api-layers-360.webp', 'api-layers-600.webp'],
    },
    closing: {
      directory: 'assets/illustrations/closing',
      files: [
        'start-desktop.webp',
        'start-desktop-dark.webp',
        'start-1024.webp',
        'start-1024-dark.webp',
        'start-768.webp',
        'start-768-dark.webp',
        'start-430.webp',
        'start-430-dark.webp',
        'start-390.webp',
        'start-390-dark.webp',
        'start-360.webp',
        'start-360-dark.webp',
        'start-320.webp',
        'start-320-dark.webp',
      ],
    },
    walkthrough: {
      directory: 'assets/illustrations/walkthrough',
      files: [
        'step-query.webp',
        'step-query-dark.webp',
        'step-query-360.webp',
        'step-query-dark-360.webp',
        'step-query-600.webp',
        'step-query-dark-600.webp',
        'step-results.webp',
        'step-results-dark.webp',
        'step-results-360.webp',
        'step-results-dark-360.webp',
        'step-results-600.webp',
        'step-results-dark-600.webp',
        'step-host.webp',
        'step-host-dark.webp',
        'step-host-360.webp',
        'step-host-dark-360.webp',
        'step-host-600.webp',
        'step-host-dark-600.webp',
      ],
    },
  },
  artwork: {
    'editorial/evidence.webp': {
      responsive: true,
    },
    'editorial/investigation.webp': {
      responsive: true,
    },
    'editorial/scope.webp': {
      responsive: true,
    },
    'inner/search.webp': {
      responsive: false,
    },
    'inner/methodology.webp': {
      responsive: false,
    },
    'inner/monitoring.webp': {
      responsive: false,
    },
    'inner/teams.webp': {
      responsive: false,
    },
    'inner/api.webp': {
      responsive: false,
    },
    'inner/pricing.webp': {
      responsive: false,
    },
    'inner/about.webp': {
      responsive: false,
    },
    'inner/scanning.webp': {
      responsive: false,
    },
    'inner/contact.webp': {
      responsive: false,
    },
    'use-cases/bug-bounty.webp': {
      responsive: false,
    },
    'use-cases/vulnerability-research.webp': {
      responsive: false,
    },
    'use-cases/osint.webp': {
      responsive: false,
    },
  },
} as const;
