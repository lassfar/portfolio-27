/**
 * Makes the whole page inert but what `keep` names (P27-94: the page under the mode switch's
 * transition screen, which keeps itself and the switch): every child of <body>, and any that
 * arrives meanwhile (a new tree's portals). Not focusable, not clickable, hidden from screen
 * readers. Those already inert are left alone. Returns the undo (only what it changed).
 */
export function inertExcept(keep: (el: HTMLElement) => boolean): () => void {
  const changed: HTMLElement[] = [];
  const apply = (node: Node) => {
    if (!(node instanceof HTMLElement) || node.inert || keep(node)) return;
    node.inert = true;
    changed.push(node);
  };
  Array.from(document.body.children).forEach(apply);
  const arrivals = new MutationObserver((records) =>
    records.forEach((record) => record.addedNodes.forEach(apply)),
  );
  arrivals.observe(document.body, { childList: true });
  return () => {
    arrivals.disconnect();
    for (const el of changed) el.inert = false;
  };
}
