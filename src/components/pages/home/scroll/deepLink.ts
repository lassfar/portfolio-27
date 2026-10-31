import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";

/**
 * Links to a chapter (P27-113): `lassfar.com/#craft` opens on the Craft, in either mode. The
 * links are the chapters' own ids (`#maker`, `#way-out`…, the book's element ids too), and the
 * address follows the chapter on screen, so a copied address or a reload comes back to it.
 * The pure parts here (no GSAP: the calm book uses them too); each tree has its own component
 * for arriving and following (JourneyDeepLink, BookDeepLink).
 */

/** How long a chapter holds on screen before the address follows (ms): not mid-glide. */
export const ADDRESS_SETTLE_MS = 400;

/** A name squashed for comparing: no accents, no case, letters and digits only. */
const squash = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const BY_KEY = new Map<string, ChapterId>(CHAPTER_IDS.map((id) => [squash(id), id]));

/**
 * The chapter a hash names, or null: `#craft`, `#Craft`, `#the-craft`, `#TheCraft`,
 * `#way-out`, `#wayout` and `#Way%20Out` all name theirs.
 */
export function chapterFromHash(hash: string): ChapterId | null {
  let name = hash.replace(/^#/, "");
  try {
    name = decodeURIComponent(name);
  } catch {
    // A stray "%": compared as typed.
  }
  const key = squash(name);
  if (!key) return null;
  return BY_KEY.get(key) ?? (key.startsWith("the") ? (BY_KEY.get(key.slice(3)) ?? null) : null);
}

/** The address `href` for chapter `id`: its hash, none for Origin (the top), the rest kept. */
export function addressFor(id: ChapterId, href: string): string {
  const url = new URL(href);
  url.hash = id === "origin" ? "" : id;
  return url.href;
}

/**
 * Puts chapter `id` in the address, without a new history entry (Back still leaves the site),
 * Next's own history state kept.
 */
export function writeAddress(id: ChapterId): void {
  try {
    const next = addressFor(id, window.location.href);
    if (next !== window.location.href) window.history.replaceState(window.history.state, "", next);
  } catch {
    // No address to rewrite (not a page), or the browser refused (too many calls).
  }
}

/**
 * Whether the address may follow the chapter now: not while the page is arriving on a link
 * (it opens at the top first) or switching modes (the trees swap and land again).
 */
export function addressCanFollow(): boolean {
  const root = document.documentElement;
  return !root.hasAttribute("data-arriving") && !root.hasAttribute("data-mode-switching");
}

/**
 * Follows the chapter on screen into the address once it has held ADDRESS_SETTLE_MS. Returns
 * `see` (call it with the chapter on screen, as often as needed) and `stop`.
 */
export function followInAddress(): { see: (id: ChapterId) => void; stop: () => void } {
  let timer = 0;
  let pending: ChapterId | null = null;
  return {
    see(id) {
      if (id === pending) return;
      pending = id;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Also tidies a link's own spelling (#TheCraft → #craft, #origin → none).
        if (addressCanFollow()) writeAddress(id);
      }, ADDRESS_SETTLE_MS);
    },
    stop() {
      window.clearTimeout(timer);
    },
  };
}
