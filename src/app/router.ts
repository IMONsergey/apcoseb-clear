import { waitForRouteReady } from './routeReadiness';
import { waitForNavigationDialog } from './navigationDialog';
import { startTransition, useEffect, useState } from 'react';
import { prepareRoute } from './routeModules';
import { siteRoutes } from '../content/routes';
import { translate, type Locale } from '../i18n/messages';
import { hasLocalizedCopy } from '../i18n/localized-routes';
import { localizedMetadataSource } from '../i18n/route-metadata';
import { getRoutePath, isRouteAvailable, localeHref, resolveSiteLocation } from './paths';

function savedScrollY(): number | undefined {
  const value: unknown = history.state?.apcoScrollY;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function resolveScroll({ smooth = false, focus = false } = {}) {
  let targetId: string;
  try {
    targetId = decodeURIComponent(location.hash.slice(1));
  } catch {
    return false;
  }
  if (!targetId) return false;
  const target = document.getElementById(targetId);
  if (!target) return false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'instant', block: 'start' });
  if (focus) {
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]'))
      target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  return true;
}

/** Preserve scroll state per history entry, including lazy route transitions. */
export function useSiteRoute(locale: Locale) {
  const [path, setPath] = useState(getRoutePath);
  useEffect(() => {
    const previousSetting = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let scrollTimer = 0;
    const scrollPositions = new Map<string, number>();
    const newEntryKey = () => Math.random().toString(36).slice(2);
    const entryKey = () => {
      const stored: unknown = history.state?.apcoScrollKey;
      if (typeof stored === 'string') return stored;
      const key = newEntryKey();
      history.replaceState({ ...history.state, apcoScrollKey: key }, '');
      return key;
    };
    let currentKey = entryKey();
    // Firefox can snapshot history state before pagehide updates it on reload.
    // Keep the departing entry's final position available to the next document.
    const departureStorageKey = 'apcosys-scroll-departure';
    let initialY = savedScrollY();
    try {
      const departure = JSON.parse(sessionStorage.getItem(departureStorageKey) ?? 'null');
      sessionStorage.removeItem(departureStorageKey);
      if (
        departure?.key === currentKey &&
        typeof departure.y === 'number' &&
        Number.isFinite(departure.y) &&
        departure.y >= 0
      ) {
        initialY = departure.y;
        history.replaceState({ ...history.state, apcoScrollY: initialY }, '');
      }
    } catch {
      // History state remains available when session storage is restricted.
    }
    let navigationVersion = 0;
    let interactionVersion = 0;
    const recordInteraction = () => {
      interactionVersion++;
    };
    let readiness = new AbortController();
    let currentPath = getRoutePath();
    let navigating = false;
    let activeTransition: ViewTransition | undefined;
    let fallbackAnimation: Animation | undefined;
    const canRecordScroll = () =>
      !navigating || document.querySelector('main')?.getAttribute('data-route') === getRoutePath();
    const saveScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = 0;
      if (!canRecordScroll()) return;
      scrollPositions.set(currentKey, scrollY);
      if (history.state?.apcoScrollKey === currentKey && savedScrollY() !== scrollY)
        history.replaceState({ ...history.state, apcoScrollY: scrollY }, '');
    };
    const saveDeparture = () => {
      saveScroll();
      if (!canRecordScroll()) return;
      try {
        sessionStorage.setItem(
          departureStorageKey,
          JSON.stringify({ key: currentKey, y: scrollY }),
        );
      } catch {
        // Storage restrictions must not interrupt navigation.
      }
    };
    const recordScroll = () => {
      if (!canRecordScroll()) return;
      // Keep exact positions in memory without writing History API state every frame.
      scrollPositions.set(currentKey, scrollY);
      if (!scrollTimer) scrollTimer = window.setTimeout(saveScroll, 500);
    };
    const waitForPage = async (targetPath: string, version: number) =>
      (await waitForRouteReady(targetPath, readiness.signal)) && version === navigationVersion;
    const applyScroll = (rememberedY?: number, smooth = false, focus = false) => {
      // A history entry remembers where reading stopped, even if its URL has a hash.
      const anchored =
        rememberedY === undefined && !!location.hash && resolveScroll({ smooth, focus });
      if (!anchored) scrollTo({ top: rememberedY ?? 0, behavior: 'instant' });
      return anchored;
    };
    const navigate = async (
      targetPath: string,
      url?: URL,
      rememberedY?: number,
      originDialog: HTMLDialogElement | null = null,
    ) => {
      const version = ++navigationVersion;
      const focusVersion = interactionVersion;
      readiness.abort();
      readiness = new AbortController();
      activeTransition?.skipTransition();
      fallbackAnimation?.cancel();
      clearTimeout(scrollTimer);
      scrollTimer = 0;
      navigating = true;
      try {
        await prepareRoute(targetPath);
        if (version !== navigationVersion) return;
        if (!(await waitForNavigationDialog(originDialog, readiness.signal))) return;
        if (version !== navigationVersion) return;
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const samePage = targetPath === currentPath;
        const commit = async () => {
          if (version !== navigationVersion) return;
          if (url && url.href !== location.href) {
            scrollPositions.set(currentKey, scrollY);
            history.replaceState({ ...history.state, apcoScrollY: scrollY }, '');
            const key = newEntryKey();
            history.pushState(
              { apcoScrollKey: key, apcoScrollY: 0 },
              '',
              url.pathname + url.search + url.hash,
            );
            currentKey = key;
          }
          // Track the committed destination before waiting for its lazy subtree.
          // A second activation can arrive while that subtree is still mounting.
          currentPath = targetPath;
          startTransition(() => setPath(targetPath));
          if (!(await waitForPage(targetPath, version))) return;
          // A control activated during loading owns focus when the route finishes.
          const preserveFocus = focusVersion !== interactionVersion;
          const anchored = applyScroll(rememberedY, samePage && !!url, !!url && !preserveFocus);
          if (!samePage && !anchored && !preserveFocus) {
            const heading = document.querySelector<HTMLElement>('main h1');
            heading?.setAttribute('tabindex', '-1');
            heading?.focus({ preventScroll: true });
          }
        };
        if (!reduced && !samePage && document.startViewTransition) {
          activeTransition = document.startViewTransition(commit);
          // Skipping a transition rejects ready independently of finished. Rendering
          // errors still propagate through updateCallbackDone to browser navigation.
          void activeTransition.ready.catch(() => undefined);
          await Promise.all([
            activeTransition.updateCallbackDone,
            activeTransition.finished.catch(() => undefined),
          ]);
        } else if (!reduced && !samePage) {
          const main = document.querySelector('main');
          fallbackAnimation = main?.animate([{ opacity: 1 }, { opacity: 0.72 }], {
            duration: 120,
            fill: 'forwards',
            easing: 'ease-out',
          });
          await fallbackAnimation?.finished.catch(() => undefined);
          if (version !== navigationVersion) return;
          await commit();
          fallbackAnimation?.cancel();
          fallbackAnimation = main?.animate([{ opacity: 0.72 }, { opacity: 1 }], {
            duration: 280,
            easing: 'ease-out',
          });
          await fallbackAnimation?.finished.catch(() => undefined);
        } else await commit();
      } catch {
        // Preserve normal browser navigation if a chunk fails to load.
        if (version === navigationVersion) location.assign(url?.href ?? location.href);
      } finally {
        if (version === navigationVersion) {
          navigating = false;
          recordScroll();
        }
      }
    };
    const sync = () => {
      const key = entryKey();
      const rememberedY = scrollPositions.get(key) ?? savedScrollY();
      currentKey = key;
      void navigate(getRoutePath(), undefined, rememberedY);
    };
    const internalAnchor = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return null;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return null;
      const resolved = resolveSiteLocation(url.pathname);
      if (
        !resolved ||
        resolved.locale !== locale ||
        !isRouteAvailable(resolved.routePath, resolved.locale)
      )
        return null;
      return {
        url,
        targetPath: resolved.routePath,
        originDialog: anchor.closest<HTMLDialogElement>('dialog.mobile-navigation'),
      };
    };
    const warm = (event: Event) => {
      const anchor = internalAnchor(event.target);
      if (anchor && anchor.targetPath !== currentPath)
        void prepareRoute(anchor.targetPath).catch(() => undefined);
    };
    const intercept = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const anchor = internalAnchor(event.target);
      if (!anchor) return;
      event.preventDefault();
      void navigate(anchor.targetPath, anchor.url, undefined, anchor.originDialog);
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('scroll', recordScroll, { passive: true });
    window.addEventListener('pagehide', saveDeparture);
    document.addEventListener('pointerdown', recordInteraction, true);
    document.addEventListener('keydown', recordInteraction, true);
    document.addEventListener('click', recordInteraction, true);
    document.addEventListener('click', intercept);
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('focusin', warm);
    if (location.hash || initialY !== undefined)
      void waitForPage(getRoutePath(), navigationVersion).then((ready) => {
        if (ready) {
          applyScroll(initialY);
          recordScroll();
        }
      });
    return () => {
      navigationVersion++;
      readiness.abort();
      activeTransition?.skipTransition();
      fallbackAnimation?.cancel();
      history.scrollRestoration = previousSetting;
      clearTimeout(scrollTimer);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('scroll', recordScroll);
      window.removeEventListener('pagehide', saveDeparture);
      document.removeEventListener('pointerdown', recordInteraction, true);
      document.removeEventListener('keydown', recordInteraction, true);
      document.removeEventListener('click', recordInteraction, true);
      document.removeEventListener('click', intercept);
      document.removeEventListener('pointerover', warm);
      document.removeEventListener('focusin', warm);
    };
  }, [locale]);

  useEffect(() => {
    const route = siteRoutes.find((item) => item.path === path);
    const localized = locale === 'en' ? null : localizedMetadataSource(path);
    const title = route
      ? path === '/' && locale === 'en'
        ? 'Apcosys — Start with a query.'
        : (localized ? translate(locale, localized.title) : route.title) + ' | Apcosys'
      : translate(locale, 'Page not found') + ' | Apcosys';
    const description = localized
      ? translate(locale, localized.description)
      : (route?.description ?? 'Find what you need on Apcosys.');
    document.documentElement.lang = locale;
    document.title = title;
    const meta = (selector: string, value: string) => {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value);
    };
    meta('meta[name="description"]', description);
    meta(
      'meta[name="robots"]',
      route && document.documentElement.dataset.indexable === 'true'
        ? 'index, follow'
        : 'noindex, nofollow',
    );
    meta('meta[property="og:title"]', title);
    meta('meta[property="og:description"]', description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    const routePath =
      path === '/404' ? location.pathname : (localeHref(path, locale) ?? location.pathname);
    const canonicalPath =
      route && route.group !== 'legal' && !routePath.endsWith('/') ? routePath + '/' : routePath;
    canonical.href = location.origin + canonicalPath;
    let ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.append(ogUrl);
    }
    ogUrl.content = canonical.href;
    document.querySelectorAll('[data-apco-social]').forEach((node) => node.remove());
    if (route && route.group !== 'legal') {
      const image = location.origin + import.meta.env.BASE_URL + 'assets/brand/social-preview.png';
      for (const [name, content] of Object.entries({
        'og:image': image,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/png',
        'og:image:alt': 'Apcosys — Start with a query. Follow what you find.',
        'twitter:card': 'summary_large_image',
        'twitter:image': image,
      })) {
        const element = document.createElement('meta');
        element.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        element.content = content;
        element.dataset.apcoSocial = '';
        document.head.append(element);
      }
    }
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-apco-hreflang]')
      .forEach((link) => link.remove());
    if (hasLocalizedCopy(path)) {
      const alternates: readonly (Locale | 'x-default')[] = ['en', 'ru', 'zh-Hant', 'x-default'];
      for (const alternateLocale of alternates) {
        const targetLocale = alternateLocale === 'x-default' ? 'en' : alternateLocale;
        const href = localeHref(path, targetLocale);
        if (!href) continue;
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = alternateLocale;
        link.href =
          location.origin + (route?.group === 'legal' || href.endsWith('/') ? href : href + '/');
        link.dataset.apcoHreflang = '';
        document.head.append(link);
      }
    }
  }, [locale, path]);
  return path;
}
