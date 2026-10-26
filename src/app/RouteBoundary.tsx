import { Component, type ReactNode } from 'react';
import { DoubleButton } from '../components/ui/DoubleButton';
import { LocaleText } from '../i18n/LocaleText';
import { RouteReady } from './RouteReady';

/** A failed initial lazy import must not remove navigation and leave an empty page. */
export class RouteBoundary extends Component<
  { children: ReactNode; path: string; onReady: (path: string) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <RouteReady path={this.props.path} onReady={this.props.onReady}>
        <section className="container route-error" role="alert">
          <h1>
            <LocaleText>This page could not load.</LocaleText>
          </h1>
          <p>
            <LocaleText>Check your connection and reload the page to try again.</LocaleText>
          </p>
          <DoubleButton onClick={() => window.location.reload()}>
            <LocaleText>Reload page</LocaleText>
          </DoubleButton>
        </section>
      </RouteReady>
    );
  }
}
