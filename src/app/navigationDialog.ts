/** Let a navigation drawer release modality and finish restoring its trigger first. */
export function waitForNavigationDialog(
  dialog: HTMLDialogElement | null,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (!dialog) return Promise.resolve(true);
  return new Promise((resolve) => {
    let frame = 0;
    const finish = (closed: boolean) => {
      cancelAnimationFrame(frame);
      dialog.removeEventListener('close', onClose);
      signal.removeEventListener('abort', onAbort);
      resolve(closed);
    };
    const onAbort = () => finish(false);
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      // Modal queues trigger restoration in this frame. Route focus must follow it,
      // including when reduced motion closed the dialog before preparation finished.
      frame = requestAnimationFrame(() => finish(true));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (dialog.open) dialog.addEventListener('close', onClose, { once: true });
    else onClose();
  });
}
