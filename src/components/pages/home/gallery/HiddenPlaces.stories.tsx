import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { pinHover, pinLabels, pinScreen, pinTurn } from "#/components/three.js/earth/pinScreen";
import { usePanelStore } from "#/stores/usePanelStore";
import { placeLabelAria } from "#/components/pages/home/panel/content";
import { laptop } from "#/stories/viewports";
import PinLabels from "./PinLabels";

const [london, ...others] = PHOTO_LOCATIONS;
const page = () => within(document.body);

/**
 * The Earth in full view with these places behind the globe (the rest in front), as the 3D pins
 * would say it every frame (`pinScreen`); no 3D here, so the story applies it itself.
 */
const behind = (ids: string[]) => () => {
  for (const loc of PHOTO_LOCATIONS) {
    pinScreen[loc.id] = { x: 400, y: 300, shown: !ids.includes(loc.id), near: true };
  }
  const apply = () => pinLabels.update?.();
  const frame = window.setInterval(apply, 50);
  apply();
  return () => {
    window.clearInterval(frame);
    for (const loc of PHOTO_LOCATIONS) delete pinScreen[loc.id];
    pinTurn.id = null;
    pinHover.id = null;
    // A pill's click opens its panel once the turn is done (or given up): none left open.
    usePanelStore.getState().close();
  };
};

/** The places behind the globe, in the bottom-right corner of a large screen: one glass pill each, as the labels are. Drawn with the labels (PinLabels), whose same frame shows each place's label or its pill. */
const meta = {
  title: "Home/HiddenPlaces",
  component: PinLabels,
  tags: ["autodocs"],
  ...laptop,
  parameters: {
    ...laptop.parameters,
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "20rem" } },
  },
  beforeEach: behind(PHOTO_LOCATIONS.map((loc) => loc.id)),
} satisfies Meta<typeof PinLabels>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All three places behind the globe: a pill each, in the data's order, named like their labels. */
export const Default: Story = {
  play: async () => {
    for (const loc of PHOTO_LOCATIONS) {
      await waitFor(() =>
        expect(page().getByRole("button", { name: placeLabelAria(loc) })).toBeVisible(),
      );
    }
  },
};

/** Only London behind the globe: its pill alone; the others keep their labels on the globe. */
export const OnePlace: Story = {
  beforeEach: behind([london.id]),
  play: async () => {
    const pill = await waitFor(() => {
      const found = document.getElementById(`place-pill-${london.id}`);
      if (!found) throw new Error("No pill yet");
      return found;
    });
    await waitFor(() => expect(pill).toBeVisible());
    for (const loc of others) {
      await waitFor(() =>
        expect(document.getElementById(`place-pill-${loc.id}`)).not.toBeVisible(),
      );
    }
  },
};

/** From the keyboard: the pill is in the Tab order (London's label, behind the globe, isn't), Enter turns the globe to it, and once it's in front its panel opens. */
export const Keys: Story = {
  beforeEach: behind([london.id]),
  play: async ({ userEvent }) => {
    const pill = await waitFor(() => {
      const found = document.getElementById(`place-pill-${london.id}`);
      if (!found || found.tabIndex < 0) throw new Error("No pill yet");
      return found;
    });
    await expect(document.getElementById(`place-label-${london.id}`)).toHaveAttribute(
      "tabindex",
      "-1",
    );
    pill.focus();
    await userEvent.keyboard("{Enter}");
    await expect(pinTurn.id).toBe(london.id);
    // The globe brings it to the front: then its panel opens.
    pinScreen[london.id].shown = true;
    await waitFor(() =>
      expect(usePanelStore.getState().content).toEqual({ kind: "place", id: london.id }),
    );
  },
};
