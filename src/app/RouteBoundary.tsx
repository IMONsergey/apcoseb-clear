import { Component, type ReactNode } from 'react';
import { DoubleButton } from '../components/ui/DoubleButton';

/** A failed initial lazy import must not remove navigation and leave an empty page. */
export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="container route-error" role="alert">
        <h1>This page could not load.</h1>
        <p>Check your connection and reload the page to try again.</p>
        <DoubleButton onClick={() => window.location.reload()}>Reload page</DoubleButton>
      </section>
    );
  }
}
