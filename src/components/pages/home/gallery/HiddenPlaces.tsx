"use client";

import { Camera } from "lucide-react";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { pinHover } from "#/components/three.js/earth/pinScreen";
import SceneLabel from "#/components/pages/home/labels/SceneLabel";
import { placePillId } from "#/components/pages/home/labels/labelIds";
import { placeLabelAria, placeLabelMeta } from "#/components/pages/home/panel/content";
import { PANEL_ID } from "#/components/pages/home/panel/config";
import { turnThenOpen } from "./turnThenOpen";

type Props = {
  /** Each pill, for PinLabels to show and hide it every frame (it owns their state). */
  pillRef: (id: string, el: HTMLButtonElement | null) => void;
  /** No panel opened yet: the pills breathe, as the labels do. */
  fresh: boolean;
};

/**
 * The Earth's places behind the globe (P27-116), on large screens: in the bottom-right corner,
 * a glass pill for each place whose label has turned to the far side, gone once it's back in
 * front. A click turns the globe to it, then opens its panel (turnThenOpen). Shown and hidden by
 * PinLabels in the same frame as the labels (opacity, `tabIndex`, pointer events: nothing
 * re-renders), so on a large screen each place has one way in, its label or its pill. Under the
 * panel, and out of its full view (SceneLabelLayer).
 */
const HiddenPlaces = ({ pillRef, fresh }: Props) => (
  <div className="fixed right-8 bottom-8 z-45 hidden flex-col items-end gap-2 lg:flex">
    {PHOTO_LOCATIONS.map((loc) => {
      const light = () => {
        pinHover.id = loc.id;
      };
      const unlight = () => {
        if (pinHover.id === loc.id) pinHover.id = null;
      };
      return (
        <SceneLabel
          key={loc.id}
          ref={(el) => pillRef(loc.id, el)}
          id={placePillId(loc.id)} // read with the Earth's words, like its label (ChapterTexts)
          labelKey={loc.id}
          icon={Camera}
          name={loc.place}
          meta={placeLabelMeta(loc)}
          fresh={fresh}
          aria-label={placeLabelAria(loc)}
          aria-controls={PANEL_ID}
          tabIndex={-1} // hidden until its place is behind the globe: PinLabels owns it from here
          className="pointer-events-none invisible opacity-0"
          onClick={() => turnThenOpen(loc.id)}
          onPointerEnter={light}
          onFocus={light}
          onPointerLeave={unlight}
          onBlur={unlight}
        />
      );
    })}
  </div>
);

export default HiddenPlaces;
