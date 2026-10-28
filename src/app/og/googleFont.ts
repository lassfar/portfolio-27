import { cacheLife } from "next/cache";

/**
 * A Google font's glyphs for `text`, as a TTF, for the share images (next/og reads TTF, not the
 * site's woff2), fetched as next/font fetches the site's. Cached (`use cache`): with Cache
 * Components an uncached fetch would draw the image on every request; this way it's drawn at
 * build, then again at most every 30 days (`cacheLife("max")`), with a fresh fetch. A failed
 * fetch throws rather than caching a fallback: the build stops (as next/font's does), and a
 * failed redraw keeps the last image.
 */
export async function googleFont(family: string, text: string): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const query = `family=${family.replaceAll(" ", "+")}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Google Fonts gave no TTF for ${family}`);
  const font = await fetch(url);
  if (!font.ok) throw new Error(`${family}: ${font.status}`);
  return font.arrayBuffer();
}
