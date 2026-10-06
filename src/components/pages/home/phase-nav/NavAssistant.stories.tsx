import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { useGlide } from "#/stores/useGlide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import NavAssistant from "./NavAssistant";
import { PHASE_STOPS } from "./config";

// Parked at the Earth's rest: the assistant offers the next chapter, the Lab.
const earth = PHASE_STOPS.find((s) => s.id === "earth")?.target ?? 0.47;

/**
 * It's portalled to the body. (A hidden element has no accessible name, so the tests keep the
 * elements they found while visible, rather than query them again by name.)
 */
const page = () => within(document.body);
const orb = () => page().findByRole("button", { name: "Next chapter: The Lab", hidden: true });
const nextChapter = () => page().findByRole("button", { name: "The Lab", hidden: true });

const meta = {
  title: "Home/NavAssistant",
  component: NavAssistant,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
  },
  beforeEach: () => {
    useJourneyScroll.setState({ progress: earth });
    return () => {
      useJourneyScroll.setState({ progress: 0 });
      useGlide.setState({ by: null });
    };
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavAssistant>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The glowing orb at the bottom (hover it: it grows and says "Next chapter"). */
export const Orb: Story = {
  play: async () => {
    await expect(await orb()).toBeVisible();
  },
};

/** A click grows the dot into the next chapter's button; the label writes in. */
export const Opened: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(await orb());
    await waitFor(async () => expect(await nextChapter()).toBeVisible(), { timeout: 3000 });
  },
};

/** While the story glides (here a timeline star's glide), it's out of the way: shrunk and dropped. Once the glide is over and the story has settled, the orb rises again. */
export const WhileGliding: Story = {
  beforeEach: () => {
    useGlide.setState({ by: "timeline" });
  },
  play: async () => {
    const dot = await orb();
    await waitFor(() => expect(dot).not.toBeVisible(), { timeout: 2000 });
    useGlide.setState({ by: null }); // the glide ends
    await waitFor(() => expect(dot).toBeVisible(), { timeout: 2000 });
  },
};

/** A glide starting while the button is open (e.g. its own click): it folds back into its dot first, then the dot shrinks and drops; the dot comes back. */
export const OpenedThenGlide: Story = {
  play: async ({ userEvent }) => {
    const dot = await orb();
    await userEvent.click(dot);
    const button = await nextChapter();
    await waitFor(() => expect(button).toBeVisible(), { timeout: 3000 });
    useGlide.setState({ by: "assistant" });
    await waitFor(() => expect(button).not.toBeVisible(), { timeout: 3000 }); // folded into the dot…
    await waitFor(() => expect(dot).not.toBeVisible(), { timeout: 2000 }); // …which then drops away
    useGlide.setState({ by: null });
    await waitFor(() => expect(dot).toBeVisible(), { timeout: 2000 });
    await expect(button).not.toBeVisible();
  },
};

/** After a glide the smooth scroll still eases in for a moment: the dot stays away until the story is still, then rises (and stays). */
export const ReturnsOnceSettled: Story = {
  beforeEach: () => {
    useGlide.setState({ by: "assistant" });
  },
  play: async () => {
    const dot = await orb();
    await waitFor(() => expect(dot).not.toBeVisible(), { timeout: 2000 });
    useGlide.setState({ by: null }); // the glide's tween is done…
    for (let i = 0; i < 12; i++) {
      // …but the story keeps easing in (as ScrollSmoother does)
      useJourneyScroll.setState({ progress: earth + (i % 2 ? 0.0004 : -0.0004) });
      await new Promise((r) => setTimeout(r, 50));
      await expect(dot).not.toBeVisible();
    }
    await waitFor(() => expect(dot).toBeVisible(), { timeout: 2000 });
    await new Promise((r) => setTimeout(r, 1500)); // and it stays (it once replayed its hide)
    await expect(dot).toBeVisible();
  },
};

/** No glide can start (here no journey to glide along, as when a panel holds the scroll): the button folds back into the orb. */
export const ClickFallsBack: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(await orb());
    const button = await nextChapter();
    await waitFor(() => expect(button).toBeVisible(), { timeout: 3000 });
    await userEvent.click(button);
    await waitFor(() => expect(button).not.toBeVisible(), { timeout: 3000 });
    await expect(await orb()).toBeVisible();
    await expect(useGlide.getState().by).toBeNull();
  },
};
