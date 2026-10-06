import type { ReactNode } from "react";

/** The scene labels' layer: they step back while a panel is open in its full view. */
const SceneLabelLayer = ({ children }: { children: ReactNode }) => (
  <div className="transition-[opacity,visibility] duration-400 panel-full:invisible panel-full:opacity-0">
    {children}
  </div>
);

export default SceneLabelLayer;
