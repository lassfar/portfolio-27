/**
 * Makes everything outside `el` inert (P27-80) — not focusable, not clickable, hidden
 * from screen readers — like a native modal dialog, for a dialog that can't be one: it
 * walks up from `el` to <body>, setting `inert` on each sibling along the way (those
 * already inert are left alone). Works across portals and nested overlays. Returns the
 * undo (only what it changed).
 */
export function inertOutside(el: HTMLElement): () => void {
  const changed: HTMLElement[] = [];
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      sibling.inert = true;
      changed.push(sibling);
    }
  }
  return () => {
    for (const sibling of changed) sibling.inert = false;
  };
}
