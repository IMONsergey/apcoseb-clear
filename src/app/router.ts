import { waitForRouteReady } from './routeReadiness';
import { startTransition, useEffect, useState } from 'react';
import { prepareRoute } from './routeModules';
import { siteRoutes } from '../content/routes';
import { translate, type Locale } from '../i18n/messages';
import { hasLocalizedCopy } from '../i18n/localized-routes';
import { localizedMetadataSource } from '../i18n/route-metadata';
import { getRoutePath, isRouteAvailable, localeHref, resolveSiteLocation } from './paths';

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
    let frame = 0;
    let navigationVersion = 0;
    let readiness = new AbortController();
    let currentPath = getRoutePath();
    let navigating = false;
    let activeTransition: ViewTransition | undefined;
    let fallbackAnimation: Animation | undefined;
    const recordScroll = () => {
      if (navigating) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!navigating) history.replaceState({ ...history.state, apcoScrollY: scrollY }, '');
      });
    };
    const waitForPage = async (targetPath: string, version: number) =>
      (await waitForRouteReady(targetPath, readiness.signal)) && version === navigationVersion;
    const applyScroll = (y: number, smooth = false, focus = false) => {
      if (!location.hash || !resolveScroll({ smooth, focus }))
        scrollTo({ top: y, behavior: 'instant' });
    };
    const navigate = async (targetPath: string, url?: URL, rememberedY = 0) => {
      const version = ++navigationVersion;
      readiness.abort();
      readiness = new AbortController();
      activeTransition?.skipTransition();
      fallbackAnimation?.cancel();
      cancelAnimationFrame(frame);
      navigating = true;
      try {
        await prepareRoute(targetPath);
        if (version !== navigationVersion) return;
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const samePage = targetPath === currentPath;
        const commit = async () => {
          if (version !== navigationVersion) return;
          if (url && url.href !== location.href) {
            history.replaceState({ ...history.state, apcoScrollY: scrollY }, '');
            history.pushState({ apcoScrollY: 0 }, '', url.pathname + url.search + url.hash);
          }
          startTransition(() => setPath(targetPath));
          if (!(await waitForPage(targetPath, version))) return;
          currentPath = targetPath;
          applyScroll(rememberedY, samePage && !!url, samePage && !!url);
          if (!samePage) {
            const heading = document.querySelector<HTMLElement>('main h1');
            heading?.setAttribute('tabindex', '-1');
            heading?.focus({ preventScroll: true });
          }
        };
        if (!reduced && !samePage && document.startViewTransition) {
          activeTransition = document.startViewTransition(commit);
          // A newer navigation may skip the old animation; its update still settles safely.
          await activeTransition.finished.catch(() => undefined);
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
      const rememberedY = Number(history.state?.apcoScrollY) || 0;
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
      return { url, targetPath: resolved.routePath };
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
      if (anchor.url.href === location.href && !navigating) {
        if (anchor.url.hash) resolveScroll({ smooth: true, focus: true });
        return;
      }
      void navigate(anchor.targetPath, anchor.url);
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('scroll', recordScroll, { passive: true });
    document.addEventListener('click', intercept);
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('focusin', warm);
    if (location.hash)
      void waitForPage(getRoutePath(), navigationVersion).then((ready) => {
        if (ready) resolveScroll();
      });
    return () => {
      navigationVersion++;
      readiness.abort();
      activeTransition?.skipTransition();
      fallbackAnimation?.cancel();
      history.scrollRestoration = previousSetting;
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('scroll', recordScroll);
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
    meta('meta[property="og:title"]', title);
    meta('meta[property="og:description"]', description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    const canonicalPath =
      path === '/404' ? location.pathname : (localeHref(path, locale) ?? location.pathname);
    canonical.href = location.origin + canonicalPath;
    let ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.append(ogUrl);
    }
    ogUrl.content = canonical.href;
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
        link.href = location.origin + href;
        link.dataset.apcoHreflang = '';
        document.head.append(link);
      }
    }
  }, [locale, path]);
  return path;
}
