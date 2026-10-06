import type { ReactNode } from "react";

/**
 * The scene labels' layer: they step back while a panel is open in its full view — and
 * come back at once when it closes (visible first, then fading in), so focus can return
 * to the label that opened it.
 */
const SceneLabelLayer = ({ children }: { children: ReactNode }) => (
  <div className="transition-opacity duration-400 panel-full:invisible panel-full:opacity-0 panel-full:transition-[opacity,visibility]">
    {children}
  </div>
);

export default SceneLabelLayer;
