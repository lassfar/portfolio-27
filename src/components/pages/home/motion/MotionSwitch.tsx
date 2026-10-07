"use client";

import { createPortal } from "react-dom";
import IconButton from "#/components/UI/buttons/IconButton";
import { Calm, Lively } from "#/components/UI/icons/motion";
import { useIsClient } from "#/components/hooks/useIsClient";
import { useCalm, useMotion } from "#/stores/useMotion";

/** Until the calm book ships (P27-65, Phase 2), the switch shows only with `?calm` in the URL. */
const askedFor = () => new URLSearchParams(window.location.search).has("calm");

type Props = {
  /** Shown whatever the URL (Storybook; the site, once the calm book ships). */
  always?: boolean;
};

/**
 * The "Reduce motion" switch (P27-92): a glass icon button in the top-right corner, the
 * same in both modes. Pressed, the site is calm (short fades only, nothing moving); not
 * pressed, full motion. It starts from the device setting and remembers the visitor's
 * choice (stores/useMotion). It steps away while a panel is open, whose controls take the
 * corner. Portalled to the body, like the page's other fixed parts; only on the client,
 * where its state lives.
 */
const MotionSwitch = ({ always = false }: Props) => {
  const client = useIsClient();
  const calm = useCalm();
  if (!client || !(always || askedFor())) return null;
  return createPortal(
    <div className="fixed top-4.5 right-4.5 z-46 transition-[opacity,visibility] duration-300 sm:top-6 sm:right-6 panel-open:invisible panel-open:opacity-0">
      <IconButton
        icon={calm ? Calm : Lively}
        label="Reduce motion"
        pressed={calm}
        tooltip={calm ? "Calm motion · on" : "Calm motion · off"}
        onClick={() => useMotion.getState().setChoice(calm ? "full" : "calm")}
      />
    </div>,
    document.body,
  );
};

export default MotionSwitch;
