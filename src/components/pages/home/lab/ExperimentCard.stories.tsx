import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { PANEL_VIEWS } from "#/stores/usePanelStore";
import { inCalm } from "#/stories/motion";
import { EXPERIMENTS } from "#/components/three.js/voyager/data";
import ExperimentCard from "./ExperimentCard";

const meta = {
  title: "Home/Lab/ExperimentCard",
  component: ExperimentCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story, { args }) => (
      // One cell of the Lab's grid.
      <div className={args.view === "full" ? "w-80" : "w-60"}>
        <Story />
      </div>
    ),
  ],
  argTypes: { view: { control: "inline-radio", options: PANEL_VIEWS } },
  args: { experiment: EXPERIMENTS[0], view: "side" },
} satisfies Meta<typeof ExperimentCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The status's dot, beside its words. */
const dotOf = (status: HTMLElement) => status.querySelector('[aria-hidden="true"]') as HTMLElement;

/** At the side: an experiment that isn't live yet ("Drifting in soon", a slow pulse). Not a button: nothing to open yet. */
export const Side: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Drifting in soon")).toBeInTheDocument();
    await expect(canvas.getByText("Worlds")).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).toBeNull();
    await expect(getComputedStyle(dotOf(canvas.getByText("Drifting in soon"))).animationName).toBe(
      "pulse",
    );
  },
};

/** In calm motion: its dot rests (nothing moves on its own: WCAG 2.2.2). */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(dotOf(canvas.getByText("Drifting in soon"))).animationName).toBe(
      "none",
    );
  },
};

/** In the full view: larger. */
export const Full: Story = { args: { view: "full" } };
