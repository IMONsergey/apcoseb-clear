/** Shared viewport/tab lifecycle. Rendering and reduced-motion policy stay with the owner. */
export function observeViewportActivity(element: Element, onChange: (active: boolean) => void) {
  let visible = false;
  const sync = () => onChange(visible && !document.hidden);
  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    sync();
  });
  observer.observe(element);
  document.addEventListener('visibilitychange', sync);
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}
