"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { perfMode } from "./perfReport";

const PerfHudPanel = lazy(() => import("./PerfHudPanel"));

/** The `?perf` HUD (P27-78). Its panel loads only with the flag, so visitors never download it. */
const PerfHud = () => {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(perfMode() === "probe"), []);
  if (!on) return null;
  return (
    <Suspense fallback={null}>
      <PerfHudPanel />
    </Suspense>
  );
};

export default PerfHud;
