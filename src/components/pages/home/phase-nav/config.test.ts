import { describe, expect, it } from "vitest";
import { TIMELINE } from "#/components/pages/home/timeline/config";
import { JOURNEY, mpAt, ZOOM } from "#/components/three.js/star/config";
import { nextStopAt, STAR_VIEW } from "./config";

describe('STAR_VIEW, where "To wander" lands (P27-108)', () => {
  it("is the star centred, before it bursts", () => {
    const burst = ZOOM.growEnd * JOURNEY.starSpan * JOURNEY.journeyEnd; // it grows right up to the burst
    expect(STAR_VIEW).toBeGreaterThan(0);
    expect(STAR_VIEW).toBeLessThan(burst);
  });
  it("shows the assistant, offering The Maker", () => {
    expect(STAR_VIEW).toBeGreaterThanOrEqual(mpAt(TIMELINE.showAfter));
    expect(nextStopAt(STAR_VIEW)?.id).toBe("maker");
  });
});
