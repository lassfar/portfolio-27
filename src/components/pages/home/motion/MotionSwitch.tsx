"use client";

import { createPortal } from "react-dom";
import IconButton from "#/components/UI/buttons/IconButton";
import { Calm, Lively } from "#/components/UI/icons/motion";
import { useIsClient } from "#/components/hooks/useIsClient";
import { useCalm, useMotion } from "#/stores/useMotion";

/**
 * The "Reduce motion" switch (P27-92): a glass icon button in the top-right corner, the
 * same in both modes. Pressed, the site is calm (short fades only, nothing moving); not
 * pressed, full motion. It starts from the device setting and remembers the visitor's
 * choice (stores/useMotion). It steps away while a panel is open, whose controls take the
 * corner. Portalled to the body, like the page's other fixed parts; only on the client,
 * where its state lives. Shown to every visitor (P27-93): with motion on, it's how the
 * journey's motion stops (WCAG 2.2.2). The page then reloads into the other mode (ModeGate).
 */
const MotionSwitch = () => {
  const client = useIsClient();
  const calm = useCalm();
  if (!client) return null;
  return createPortal(
    <div className="fixed top-4.5 right-4.5 z-46 transition-[opacity,visibility] duration-300 sm:top-6 sm:right-6 panel-open:invisible panel-open:opacity-0">
      <IconButton
        icon={calm ? Calm : Lively}
        label="Reduce motion"
        pressed={calm}
        tooltip={calm ? "Reduce motion · on" : "Reduce motion · off"}
        onClick={() => useMotion.getState().setChoice(calm ? "full" : "calm")}
      />
    </div>,
    document.body,
  );
};

export default MotionSwitch;
