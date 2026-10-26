/** Browser rendering only needs the directories and artwork variants. */
export const assetDirectories = {
  application: 'assets/application',
  brand: 'assets/brand',
  closing: 'assets/illustrations/closing',
} as const;

export const artwork = {
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
  'inner/investors.webp': {
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
} as const;

/** The complete catalog remains the source for asset types and build validation. */
export default {
  groups: {
    application: {
      directory: assetDirectories.application,
      files: [
        'aperture.svg',
        'run-search.svg',
        'netherlands.svg',
        'germany.svg',
        'united-states.svg',
        'filter-plus.svg',
        'type-chevron.svg',
        'nginx.svg',
        'copy-white.svg',
        'copy-accent.svg',
        'code.svg',
        'external.svg',
        'certificate.svg',
        'link.svg',
      ],
    },
    brand: {
      directory: assetDirectories.brand,
      files: ['favicon.svg', 'logo.svg', 'social-preview.svg', 'social-preview.png'],
    },
    closing: {
      directory: assetDirectories.closing,
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
  },
  artwork,
} as const;
