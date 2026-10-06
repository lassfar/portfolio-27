import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { EXPERIMENTS } from "#/components/three.js/voyager/data";
import ExperimentCard from "./ExperimentCard";

const meta = {
  title: "Home/Lab/ExperimentCard",
  component: ExperimentCard,
  decorators: [
    (Story, { args }) => (
      <div className={args.view === "full" ? "w-80 p-12" : "w-60 p-12"}>
        <Story />
      </div>
    ),
  ],
  args: { experiment: EXPERIMENTS[0], view: "full" },
} satisfies Meta<typeof ExperimentCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An experiment that isn't live yet: "Drifting in soon", a slow pulse. Not a button (nothing to open yet). */
export const Soon: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Drifting in soon")).toBeInTheDocument();
    await expect(canvas.getByText("Worlds")).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** At the side: smaller. */
export const Side: Story = { args: { view: "side", experiment: EXPERIMENTS[1] } };
