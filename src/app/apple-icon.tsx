import { ImageResponse } from "next/og";
import DotsSvg from "./og/DotsSvg";
import { dotsIn, starDots } from "./og/starDots";
import { SITE } from "./site";

/** The icon a phone keeps for the site (its home screen, P27-98): the site's dotted star, close up. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // The share card's star, cropped round its glow (its tips reach A): its dots shrink with it.
  const { dots, cx, cy, A } = starDots(1200, 630);
  const view = [cx - A * 0.8, cy - A * 0.8, A * 1.6, A * 1.6];
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: SITE.background }}>
      <DotsSvg dots={dotsIn(dots, view)} view={view} {...size} />
    </div>,
    size,
  );
}
