import { ImageResponse } from "next/og";
import { PEACH, LIGHT_PEACH } from "#/components/pages/home/book/dots/patterns";
import DotsSvg from "./og/DotsSvg";
import { googleFont } from "./og/googleFont";
import { starDots } from "./og/starDots";
import { SITE } from "./site";

/**
 * The share card (P27-98): the site's dotted star on rich black, the name under it in Great
 * Vibes ("Lassfar" in peach, as the site's accents), the role in Krona One capitals. Drawn at
 * build (then at most monthly: its fonts' cache, og/googleFont.ts); links to the site show it
 * (LinkedIn, X, Slack…).
 */
export const alt = `${SITE.name}, ${SITE.role}: a star drawn in dots`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [FIRST, LAST] = SITE.name.split(" ");
const ROLE = SITE.role.toUpperCase();

export default async function Image() {
  const { width, height } = size;
  // The star framed as the book's cover frames it: the top of the card, the words under it.
  const { dots } = starDots(width, height);
  const [script, caps] = await Promise.all([
    googleFont("Great Vibes", SITE.name),
    googleFont("Krona One", ROLE),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 54,
        background: SITE.background,
        color: "white",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
        <DotsSvg dots={dots} view={[0, 0, width, height]} width={width} height={height} />
      </div>
      <div style={{ display: "flex", fontFamily: "Great Vibes", fontSize: 104, lineHeight: 1.1 }}>
        <span>{FIRST}&nbsp;</span>
        <span style={{ color: PEACH }}>{LAST}</span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: "Krona One",
          fontSize: 22,
          letterSpacing: 7,
          color: LIGHT_PEACH,
          opacity: 0.8,
        }}
      >
        {ROLE}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Great Vibes", data: script, weight: 400 },
        { name: "Krona One", data: caps, weight: 400 },
      ],
    },
  );
}
