"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { DotMark, Dot, ShapeName } from "#/components/pages/home/book/dots/dots.types";
import {
  createField,
  paintAll,
  paintArea,
  stepLight,
  type Field,
  type Pointer,
} from "#/components/pages/home/book/dots/engine";
import { loadLand } from "#/components/pages/home/book/dots/landMask";
import { MARK } from "#/components/pages/home/book/dots/marks";
import { hash, seeded } from "#/components/pages/home/book/dots/patterns";
import { SHAPES } from "#/components/pages/home/book/dots/shapes";

/** The longest frame the light accounts for (s): after a hidden tab, it doesn't jump. */
const MAX_DT = 0.05;

type Drawn = { w: number; h: number; marks: DotMark[] };

/** A mark over the dots. */
const Mark = ({ mark }: { mark: DotMark }) => {
  switch (mark.kind) {
    case "ring":
      return <circle className={MARK.ring} cx={mark.x} cy={mark.y} r={mark.r} />;
    case "line":
      return <line className={MARK.line} x1={mark.x1} y1={mark.y1} x2={mark.x2} y2={mark.y2} />;
    case "label":
      return (
        <text
          className={clsx(MARK.label, "text-[11.5px]")}
          x={mark.x}
          y={mark.y}
          textAnchor={mark.anchor}
        >
          {mark.text}
        </text>
      );
  }
};

/**
 * A dotted shape of the calm book (P27-93), drawn on a canvas at its figure's size, with its
 * labels over it (SVG). Drawn once, then again only where the pointer lights it (engine.ts),
 * and redrawn when the figure changes size. Loaded only in the browser, by `DotField`.
 */
const DotCanvas = ({ shape }: { shape: ShapeName }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawn, setDrawn] = useState<Drawn | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    let field: Field | null = null;
    let size = { w: 0, h: 0 };
    let pointer: Pointer = null;
    let raf = 0;
    let last = 0;
    let isLand: ((lat: number, lon: number) => boolean) | null =
      shape === "earth" ? null : () => false;

    const build = () => {
      const w = Math.round(host.clientWidth);
      const h = Math.round(host.clientHeight);
      if (!w || !h || !isLand || (w === size.w && h === size.h)) return;
      size = { w, h };
      const dots: Dot[] = [];
      const marks: DotMark[] = [];
      const pen = {
        dot: (x: number, y: number, r: number, c: string, a: number) =>
          dots.push({ x, y, r, c, a }),
        mark: (mark: DotMark) => marks.push(mark),
      };
      SHAPES[shape](pen, {
        w,
        h,
        rnd: seeded(hash(shape)),
        viewportHeight: window.innerHeight,
        isLand,
      });
      field = createField(dots);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintAll(ctx, field, w, h);
      setDrawn({ w, h, marks });
    };

    const frame = (now: number) => {
      raf = 0;
      if (!field) return;
      const dt = last ? Math.min(MAX_DT, (now - last) / 1000) : 1 / 60;
      last = now;
      const { dirty, busy } = stepLight(field, pointer, dt);
      if (dirty) paintArea(ctx, field, dirty);
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const follow = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      wake();
    };
    const release = () => {
      pointer = null;
      wake();
    };
    // A finger lifts: its light fades. A mouse stays over the figure: its light stays.
    const lift = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") release();
    };
    host.addEventListener("pointermove", follow);
    host.addEventListener("pointerdown", follow);
    host.addEventListener("pointerleave", release);
    host.addEventListener("pointercancel", release);
    host.addEventListener("pointerup", lift);

    const resized = new ResizeObserver(build);
    resized.observe(host);

    let gone = false;
    if (!isLand) {
      void loadLand().then((land) => {
        if (gone) return;
        isLand = land;
        build();
      });
    }

    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      resized.disconnect();
      host.removeEventListener("pointermove", follow);
      host.removeEventListener("pointerdown", follow);
      host.removeEventListener("pointerleave", release);
      host.removeEventListener("pointercancel", release);
      host.removeEventListener("pointerup", lift);
    };
  }, [shape]);

  return (
    <div ref={hostRef} aria-hidden="true" className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className={clsx(
          "absolute inset-0 size-full transition-opacity duration-500",
          drawn ? "opacity-100" : "opacity-0",
        )}
      />
      {drawn && (
        <svg
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          viewBox={`0 0 ${drawn.w} ${drawn.h}`}
        >
          {drawn.marks.map((mark, i) => (
            <Mark key={i} mark={mark} />
          ))}
        </svg>
      )}
    </div>
  );
};

export default DotCanvas;
