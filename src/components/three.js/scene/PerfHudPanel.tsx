"use client";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { glideToJourney, stopGlide } from "#/components/pages/home/scroll/glide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { useQuality } from "#/stores/useQuality";
import { QUALITY_STEPS } from "./quality";
import { jumpToJourney } from "./devPanel";
import {
  buildReport,
  currentChapterName,
  gpuInfo,
  resetRecords,
  type GpuInfo,
} from "./perfReport";

const TOUR_SECONDS = 120; // the whole story at one steady pace, so runs compare
const TOUR_LEAD_MS = 1500; // settle at the top before the glide starts
const POLL_MS = 500;

type Tour = "idle" | "starting" | "running" | "done" | "stopped";

type Live = { fps: number; worst: number; chapter: string; quality: string; gpu: GpuInfo | null };

const TOUR_NOTE: Record<Tour, string> = {
  idle: `Tour: the whole story in ${TOUR_SECONDS} s (don't touch)`,
  starting: "Tour starting…",
  running: "Touring… (wheel or keys stop it)",
  done: "Tour done: copy the report",
  stopped: "Tour stopped",
};

const button =
  "rounded border border-peach/40 px-1.5 py-0.5 hover:bg-peach/10 disabled:opacity-40";

/**
 * The `?perf` HUD (P27-78): live FPS, the chapter, the GPU and the canvas, plus a tour
 * that glides through the whole story at one steady pace and a per-chapter report to
 * paste into the task. Plain and opaque (no backdrop blur), so it costs next to nothing.
 */
const PerfHudPanel = () => {
  const [live, setLive] = useState<Live | null>(null);
  const [tour, setTour] = useState<Tour>("idle");
  const [open, setOpen] = useState(true);
  const [note, setNote] = useState("");
  const [fallback, setFallback] = useState<string | null>(null);
  const tourRef = useRef<Tour>("idle");
  const tourReport = useRef<string | null>(null); // frozen as the tour ends

  const moveTour = (t: Tour) => {
    tourRef.current = t;
    setTour(t);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = window.__p27perf?.stats(30);
      setLive({
        fps: s?.fps ?? 0,
        worst: s?.frameMsMax ?? 0,
        chapter: currentChapterName(),
        quality: `${useQuality.getState().step} ${QUALITY_STEPS[useQuality.getState().step].name}`,
        gpu: gpuInfo(),
      });
      // The tour ends when its glide does: at the end of the story, or cut short by input.
      const smoother = ScrollSmoother.get();
      if (tourRef.current !== "running" || !smoother || gsap.isTweening(smoother)) return;
      const done = useJourneyScroll.getState().progress > 0.97;
      if (done) tourReport.current = buildReport(`tour (${TOUR_SECONDS} s)`);
      tourRef.current = done ? "done" : "stopped";
      setTour(tourRef.current);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const startTour = () => {
    stopGlide();
    jumpToJourney(0);
    tourReport.current = null;
    moveTour("starting");
    window.setTimeout(() => {
      resetRecords();
      moveTour(glideToJourney(1, TOUR_SECONDS, "none", "tour") ? "running" : "stopped");
    }, TOUR_LEAD_MS);
  };

  const copy = async () => {
    const text = tourReport.current ?? buildReport("manual");
    try {
      await navigator.clipboard.writeText(text);
      setNote("Copied");
      window.setTimeout(() => setNote(""), 1600);
    } catch {
      setFallback(text); // select it by hand
    }
  };

  const reset = () => {
    resetRecords();
    tourReport.current = null;
    setFallback(null);
    moveTour("idle");
  };

  const gpu = live?.gpu;
  return createPortal(
    <div className="perf-hud fixed top-3 left-3 z-[9999] w-72 rounded-md border border-gray-slate/20 bg-rich-black/90 p-2 font-mono text-[11px] leading-snug text-light-peach">
      <div className="perf-hud__head flex items-center justify-between gap-2">
        <strong className="text-peach">{live ? `${Math.round(live.fps)} fps` : "…"}</strong>
        <span>{live ? `worst ${live.worst.toFixed(1)} ms` : ""}</span>
        <button type="button" className={button} onClick={() => setOpen(!open)}>
          {open ? "–" : "+"}
        </button>
      </div>
      {open && (
        <>
          <div className="perf-hud__chapter">{live?.chapter}</div>
          <div className="perf-hud__quality">quality {live?.quality}</div>
          <div className="perf-hud__gpu truncate" title={gpu?.renderer}>
            {gpu?.renderer ?? "GPU: waiting for the scene…"}
          </div>
          {gpu && (
            <div>
              pixel ratio {gpu.pixelRatio} · {gpu.width}×{gpu.height}
            </div>
          )}
          <div className="perf-hud__actions mt-1.5 flex gap-1">
            <button
              type="button"
              className={button}
              disabled={tour === "starting" || tour === "running"}
              onClick={startTour}
            >
              Tour
            </button>
            <button type="button" className={button} onClick={copy}>
              Copy report
            </button>
            <button type="button" className={button} onClick={reset}>
              Reset
            </button>
          </div>
          <div className="perf-hud__note mt-1 opacity-80">{note || TOUR_NOTE[tour]}</div>
          {fallback && (
            <textarea
              readOnly
              value={fallback}
              onFocus={(e) => e.currentTarget.select()}
              className="perf-hud__fallback mt-1 h-32 w-full resize-none rounded bg-dark p-1"
            />
          )}
        </>
      )}
    </div>,
    document.body,
  );
};

export default PerfHudPanel;
