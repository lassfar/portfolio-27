"use client";

import dynamic from "next/dynamic";
import { useGateLive } from "#/components/pages/home/motion/gateLive";

// Drawn in the browser, like the dots: kept out of the page's HTML, so visitors with motion
// on (who never see the book) don't download them.
const DRAWINGS = {
  craft: dynamic(() => import("#/components/pages/home/book/drawings/CraftDrawing"), {
    ssr: false,
  }),
  parker: dynamic(() => import("#/components/pages/home/book/drawings/ParkerDrawing"), {
    ssr: false,
  }),
};

/**
 * One of the calm book's 2D drawings (P27-93): the Craft's constellation, Parker on its loops.
 * Drawn once the book is the mode on screen (useGateLive); its figure describes it meanwhile.
 */
const LiveDrawing = ({ name }: { name: keyof typeof DRAWINGS }) => {
  const live = useGateLive();
  const Drawing = DRAWINGS[name];
  return live ? <Drawing /> : null;
};

export default LiveDrawing;
