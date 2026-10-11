import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, type ReactNode } from "react";
import { expect, waitFor } from "storybook/test";

import { journeyLabels, journeyScreen } from "#/components/three.js/parker/journeyScreen";
import JourneyLabels from "./JourneyLabels";

/** How many markers the line has reached: the launch and the first two flybys. */
const REACHED = 3;

/** Stands in for the 3D line: calls the labels' `update` every frame, as it would. */
const Line = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      journeyLabels.update?.();
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);
  return children;
};

/** Parker's labels along its journey line, placed where the 3D would put them (P27-72). */
const meta = {
  title: "Home/JourneyLabels",
  component: JourneyLabels,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "12rem" } } },
  decorators: [
    (Story) => (
      <Line>
        <Story />
      </Line>
    ),
  ],
  beforeEach: () => {
    journeyScreen.reach = ["151", "38", "38"];
    journeyScreen.markers.forEach((marker, i) =>
      Object.assign(marker, { x: 90 + i * 150, y: 90, shown: i < REACHED, here: 1 << i }),
    );
    return () => {
      for (const marker of journeyScreen.markers) marker.shown = false;
      journeyScreen.reach = [];
    };
  },
} satisfies Meta<typeof JourneyLabels>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The markers the line has reached, named; a hover (or a press) shows a label's full text, and screen readers get it as its description. Only the shown ones are in the page. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvas.getAllByRole("button")).toHaveLength(REACHED));
    const launch = canvas.getByRole("button", { name: "Launch" });
    await expect(launch).toHaveAttribute("aria-expanded", "false");
    const long = canvasElement.querySelector(".journey-label__long")!;
    await expect(launch).toHaveAttribute("aria-describedby", long.id);
  },
};

/** From the keyboard (P27-99, WCAG 2.1.1): Tab reaches a shown label, Enter opens its full text and closes it again. */
export const Keyboard: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const launch = await canvas.findByRole("button", { name: "Launch" });
    await userEvent.tab();
    await expect(launch).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(launch).toHaveAttribute("aria-expanded", "true");
    await expect(launch).not.toHaveAttribute("aria-describedby"); // its name says it all now
    const long = canvasElement.querySelector(".journey-label__long")!;
    await expect(long).toHaveTextContent("Launch · 151 million km from the Sun");
    await waitFor(() => expect(long).toBeVisible());
    await userEvent.keyboard("{Enter}");
    await expect(launch).toHaveAttribute("aria-expanded", "false");
    await expect(launch).toHaveAttribute("aria-describedby", long.id);
    await expect(long).not.toBeVisible();
  },
};
