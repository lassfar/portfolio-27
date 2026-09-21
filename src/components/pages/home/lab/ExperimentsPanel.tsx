"use client";

import clsx from "clsx";
import { useLabStore } from "#/stores/useLabStore";
import { EXPERIMENTS } from "#/components/three.js/voyager/data";

/**
 * The Lab experiments side panel — "On the Record". Slides in from the right when
 * the Voyager's Golden Record is clicked (mirrors the Earth GalleryPanel shell),
 * leaving the craft visible beside it. M4a shows the experiments as elegant
 * placeholder tiles; M4b lazy-mounts a live tile's own canvas (the parked worlds
 * scene) via `next/dynamic({ ssr: false })`.
 */
const ExperimentsPanel = () => {
  const open = useLabStore((s) => s.open);
  const close = useLabStore((s) => s.close);

  return (
    <aside
      aria-hidden={!open}
      className={clsx(
        "fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-white/10 bg-rich-black/80 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[440px] lg:w-[540px]",
        open
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-full opacity-0"
      )}
    >
      <header className="relative shrink-0 px-8 pt-12 lg:px-12">
        <button
          type="button"
          onClick={close}
          aria-label="Close the Lab"
          className="absolute right-6 top-8 grid h-10 w-10 place-items-center rounded-full text-lg text-white/50 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-peach lg:right-10"
        >
          ✕
        </button>

        <p className="text-[11px] uppercase tracking-[0.4em] text-peach/80">
          The Lab · sent into the dark
        </p>
        <h2 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight text-white lg:text-5xl">
          On the Record
        </h2>
        <span className="mt-5 block h-px w-16 bg-gradient-to-r from-peach to-transparent" />
        <p className="mt-6 max-w-sm text-[15px] font-light italic leading-relaxed text-gray-slate/70">
          Small experiments in motion, shaders and code — carried on Voyager’s
          Golden Record. More will drift into orbit soon.
        </p>
      </header>

      <div className="mt-8 flex-1 overflow-y-auto px-8 pb-14 lg:px-12">
        <div className="grid grid-cols-2 gap-3">
          {EXPERIMENTS.map((x) => (
            <div
              key={x.id}
              className={clsx(
                "flex aspect-[4/3] flex-col justify-end rounded-xl border p-4 transition",
                x.status === "live"
                  ? "cursor-pointer border-peach/40 bg-dark/60 shadow-[inset_0_0_40px_rgba(239,125,20,0.08)] hover:shadow-[inset_0_0_54px_rgba(239,125,20,0.18)]"
                  : "border-white/8 bg-dark/40"
              )}
            >
              <p
                className={clsx(
                  "text-[9px] uppercase tracking-[0.3em]",
                  x.status === "live" ? "text-peach" : "text-white/30"
                )}
              >
                {x.status === "live" ? "Live" : "Drifting in soon"}
              </p>
              <p
                className={clsx(
                  "mt-1 text-sm font-light",
                  x.status === "live" ? "text-white" : "text-white/45"
                )}
              >
                {x.title}
              </p>
              <p className="mt-1 text-[11px] font-light leading-snug text-white/35">
                {x.blurb}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ExperimentsPanel;
