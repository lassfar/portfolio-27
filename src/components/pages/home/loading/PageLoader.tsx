import { LOADER } from "#/components/pages/home/story/copy";

/** The planet's ring, tilted (the sketch and the ink draw the same one). */
const RING = { rx: 34, ry: 8, transform: "rotate(-14)" } as const;

/** The viewfinder's corners, near the screen's edges. */
const VIEWFINDER = [
  "top-5 left-5 border-t border-l sm:top-8 sm:left-8",
  "top-5 right-5 border-t border-r sm:top-8 sm:right-8",
  "bottom-5 left-5 border-b border-l sm:bottom-8 sm:left-8",
  "bottom-5 right-5 border-r border-b sm:right-8 sm:bottom-8",
];

/** A small spaced capital's style (the percentage, the camera's settings): 4.5:1 or more. */
const SMALL_CAPS = "font-krone-one text-3xs tracking-caps text-white/50";

/**
 * The loading screen (P27-115): while the journey loads, a pencil sketches the planet and its
 * ring, then peach ink fills them; under it, a line in Aymane's voice, the percentage and a hint
 * at how the journey works; around it, a viewfinder's corners and a camera's settings. Server-
 * rendered, so it's there from the first paint, and shown only while <html> is marked
 * `data-loading` (the head script, full motion only: calm and no-script visitors never see it).
 * The drawing follows `--load` (0–1, set by PageLoaderProgress as the journey loads; a short CSS
 * lead-in starts it before the app's code arrives), styled in globals.css (`page-loader`). The
 * Reduce motion switch steps away meanwhile (`loading:`); it shows the real progress, so it
 * may run on its own (WCAG 2.2.2's loading exception). A progress bar for screen readers; the
 * rest is decorative.
 */
const PageLoader = () => (
  <div
    data-page-loader
    role="progressbar"
    aria-label={LOADER.label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={0}
    className="page-loader fixed inset-0 z-47 flex flex-col items-center justify-center bg-rich-black"
  >
    {/* The viewfinder: its corners, and the camera's settings. */}
    {VIEWFINDER.map((corner) => (
      <span
        key={corner}
        aria-hidden="true"
        className={`pointer-events-none absolute size-8 border-gray-slate/45 sm:size-12 ${corner}`}
      />
    ))}
    <span
      aria-hidden="true"
      className={`${SMALL_CAPS} absolute right-9 bottom-9 sm:right-12 sm:bottom-12`}
    >
      {LOADER.camera}
    </span>

    <svg
      viewBox="-60 -34 120 68"
      aria-hidden="true"
      focusable="false"
      className="relative w-80 max-w-[72vw]"
    >
      <circle r="18" pathLength={1} className="page-loader__pencil" />
      <ellipse {...RING} pathLength={1} className="page-loader__pencil" />
      <circle r="18" className="page-loader__ink" />
      <ellipse {...RING} pathLength={1} className="page-loader__ink-ring" />
    </svg>
    <p aria-hidden="true" className="relative mt-6 text-sm text-white/72">
      {LOADER.line}
    </p>
    <span aria-hidden="true" className={`page-loader__pct ${SMALL_CAPS} relative mt-3`} />
    <p
      aria-hidden="true"
      className="absolute inset-x-6 bottom-16 text-center text-xs text-white/60 sm:bottom-20"
    >
      {LOADER.hint}
    </p>
  </div>
);

export default PageLoader;
