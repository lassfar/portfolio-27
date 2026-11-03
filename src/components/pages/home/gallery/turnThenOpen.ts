import { pinHover, pinScreen, pinTurn } from "#/components/three.js/earth/pinScreen";
import { usePanelStore } from "#/stores/usePanelStore";

/** The longest the globe may take to bring a place to the front before its panel opens (ms). */
export const TURN_MS = 1500;

type Deps = {
  frame?: (step: () => void) => unknown;
  now?: () => number;
  open?: (id: string) => void;
};

/**
 * A hidden place's pill was clicked (P27-116, HiddenPlaces): the globe turns the place round to
 * face you (`pinTurn`, as a far-side label's focus does, P27-99), then its panel opens, once its
 * pin is in front (or after TURN_MS anyway). The place stays lit meanwhile (`pinHover`), which
 * also holds the globe's idle spin, so it can't carry the place away again mid-turn.
 */
export function turnThenOpen(
  id: string,
  {
    frame = (step) => requestAnimationFrame(step),
    now = () => performance.now(),
    open = (place) => usePanelStore.getState().open({ kind: "place", id: place }),
  }: Deps = {},
): void {
  pinTurn.id = id;
  pinHover.id = id;
  const until = now() + TURN_MS;
  const check = () => {
    if (!pinScreen[id]?.shown && now() < until) {
      frame(check);
      return;
    }
    open(id);
    if (pinHover.id === id) pinHover.id = null;
  };
  frame(check);
}
