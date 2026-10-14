/** Public document routes. Document bodies live in a separate lazy chunk. */
export const legalRoutes = [
  {
    path: '/legal/api-data-license-agreement',
    title: 'API & Data License Agreement',
    description: 'Terms for accessing the Apcosys API and using its data.',
  },
  {
    path: '/legal/cookie-policy',
    title: 'Cookie Policy',
    description:
      'How cookies and related technologies are used, and how to manage your preferences.',
  },
  {
    path: '/legal/data-collection-policy',
    title: 'Data Collection Policy',
    description:
      'What Apcosys collects, how it is collected, and the purpose of those observations.',
  },
  {
    path: '/legal/data-processing-agreement',
    title: 'Data Processing Agreement',
    description: 'How personal data is processed, protected and retained when you use Apcosys.',
  },
  {
    path: '/legal/privacy-policy',
    title: 'Privacy Policy',
    description:
      'How Apcosys collects, uses and shares personal information, and the choices available to you.',
  },
  {
    path: '/legal/terms',
    title: 'Terms & Conditions',
    description: 'The terms governing access to the Apcosys website and services.',
  },
] as const;
