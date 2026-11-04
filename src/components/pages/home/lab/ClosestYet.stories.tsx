import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { expect, waitFor } from "storybook/test";

import { PARKER_JOURNEY } from "#/components/three.js/parker/config";
import { journeyReadout, journeyScreen } from "#/components/three.js/parker/journeyScreen";
import ClosestYet from "./ClosestYet";

/** The readout as the 3D line would publish it (`journeyScreen.readout`); no 3D here. */
const Published = ({ km, record }: { km: string; record: boolean }) => {
  useEffect(() => {
    journeyScreen.readout = { shown: true, km, record };
    journeyReadout.update?.();
  }, [km, record]);
  return <ClosestYet />;
};

/** How close Parker has come to the Sun yet, in the corner: a digit on each drum. Change `km` (Controls) to see them roll. */
const meta = {
  title: "Home/ClosestYet",
  component: Published,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "12rem" } },
  },
  args: { km: "24.1", record: false },
} satisfies Meta<typeof Published>;

export default meta;

type Story = StoryObj<typeof meta>;

const drums = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(".closest-yet__drum")];

/** On its way: the digits on their drums, the leading drum away; its words for screen readers once it holds. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const root = canvasElement.ownerDocument.body;
    await waitFor(() => expect(canvas.getByText(PARKER_JOURNEY.readout.unit)).toBeVisible());
    const [hundreds, tens, ones, tenths] = drums(root);
    await expect(hundreds).not.toBeVisible();
    await expect(tens.dataset.digit).toBe("2");
    await expect(ones.dataset.digit).toBe("4");
    await expect(tenths.dataset.digit).toBe("1");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("24.1 million km"), {
      timeout: 2000,
    });
  },
};

/** At its record: the digits in peach, with its line. */
export const Record: Story = {
  args: { km: "6.1", record: true },
  play: async ({ canvas, canvasElement }) => {
    const line = canvas.getByText(PARKER_JOURNEY.readout.record);
    const root = canvasElement.ownerDocument.querySelector<HTMLElement>("[data-closest-yet]")!;
    // Settled, for the accessibility check to measure its colours, not a fade.
    await waitFor(() => {
      expect(getComputedStyle(root).opacity).toBe("1");
      expect(getComputedStyle(line).opacity).toBe("1");
    });
  },
};

/** No longer readable: it fades out, then leaves the page (GSAP's autoAlpha). */
export const FadesOut: Story = {
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvas.getByText(PARKER_JOURNEY.readout.unit)).toBeVisible());
    journeyScreen.readout.shown = false;
    journeyReadout.update?.();
    const root = canvasElement.ownerDocument.querySelector<HTMLElement>("[data-closest-yet]")!;
    await waitFor(() => expect(getComputedStyle(root).visibility).toBe("hidden"), {
      timeout: 2000,
    });
  },
};
