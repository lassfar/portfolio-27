import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { inCalm } from "#/stories/motion";
import { MOTION_STORAGE_KEY } from "#/stores/motionPreference";
import { useModeSwitch } from "#/stores/useModeSwitch";
import { useMotion } from "#/stores/useMotion";
import { useGateLive } from "./gateLive";
import ModeGate from "./ModeGate";
import MotionSwitch from "./MotionSwitch";

/** A stand-in for one mode's side of the page: says whether it may start. */
const Probe = ({ name }: { name: string }) => (
  <p className="p-6 text-white/80">
    {name}: {useGateLive() ? "live" : "waiting"}
  </p>
);

/**
 * The page's mode gate (P27-93): the journey with motion, the calm book in the calm mode. Here
 * with stand-ins for the two; it switches live only when asked (`switchLive`, as the site does).
 */
const meta = {
  title: "Home/Motion/ModeGate",
  component: ModeGate,
  tags: ["autodocs"],
  args: { full: <Probe name="The journey" />, calm: <Probe name="The calm book" /> },
  argTypes: { full: { control: false }, calm: { control: false }, switchLive: { control: false } },
} satisfies Meta<typeof ModeGate>;

export default meta;

type Story = StoryObj<typeof meta>;

/** With motion: only the journey stays, and it is live (it may start its pin, scroll and 3D). */
export const Full: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("The journey: live")).toBeVisible();
    await expect(canvas.queryByText(/The calm book/)).toBeNull();
  },
};

/** In the calm mode: only the calm book stays, live (its dots draw). */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("The calm book: live")).toBeVisible();
    await expect(canvas.queryByText(/The journey/)).toBeNull();
  },
};

/**
 * Switching live (P27-94), as on the site: the switch pressed, the transition screen covers the
 * page (inert under it), the other mode mounts behind it, then it fades. The switch keeps the
 * focus throughout, and the status line says where the visitor is.
 */
export const SwitchLive: Story = {
  args: { switchLive: true },
  render: (args) => (
    <>
      <ModeGate {...args} />
      <MotionSwitch />
    </>
  ),
  // Back to where the next story starts: the journey, no choice kept.
  beforeEach: () => () => {
    useModeSwitch.setState({ shown: null, veil: null, status: "" });
    localStorage.removeItem(MOTION_STORAGE_KEY);
    useMotion.setState({ choice: null });
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByText("The journey: live")).toBeVisible();
    const button = await within(document.body).findByRole("button", { name: "Reduce motion" });
    button.focus();
    await userEvent.keyboard(" ");
    const page = canvasElement.closest<HTMLElement>("body > *")!;
    await waitFor(() => expect(document.querySelector("[data-mode-veil]")).not.toBeNull());
    await waitFor(() => expect(page.inert).toBe(true));
    await expect(button).toHaveFocus();
    await waitFor(() => expect(canvas.getByText("The calm book: live")).toBeInTheDocument(), {
      timeout: 4000,
    });
    await expect(canvas.queryByText(/The journey/)).toBeNull();
    await waitFor(() => expect(document.querySelector("[data-mode-veil]")).toBeNull(), {
      timeout: 5000,
    });
    await expect(page.inert).toBe(false);
    await expect(button).toHaveFocus();
    await expect(within(document.body).getByRole("status")).toHaveTextContent(
      "Reduce motion on: Origin",
    );
    await expect(document.documentElement.dataset.motion).toBe("calm");
  },
};
