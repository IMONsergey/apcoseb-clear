import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocaleProvider } from './i18n/LocaleProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/instrument-sans.css';
import './styles/ibm-plex-mono.css';
import './styles/tokens.css';
import './styles/type-scale.css';
import './styles/base.css';
import './styles/controls.css';
import './styles/site.css';
import './styles/navigation.css';
import './styles/micro-motion.css';
import './styles/interaction-feedback.css';
import './styles/mobile-layout.css';
import './styles/localization.css';
import './styles/text-motion.css';
import './styles/interface-layout.css';

const element = document.getElementById('root');
if (!element) throw new Error('The application root was not found.');
createRoot(element).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);

import './components/Footer.css';

import './styles/theme.css';
