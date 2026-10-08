"use client";

import { createContext, use } from "react";

/**
 * Whether this part of the page is the mode on screen and may start (P27-93): its motion,
 * its scroll, its canvases. Set by the ModeGate around the journey and the calm book: false
 * while the page loads (both are there, the CSS showing one), then true for the one that
 * stays. Outside a gate (Storybook), always true.
 */
export const GateLive = createContext(true);

/** Whether this part of the page may start (see GateLive). */
export const useGateLive = () => use(GateLive);
