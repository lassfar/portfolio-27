import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { useJourneyScroll } from "#/stores/useJourneyScroll";
import NavAssistant from "./NavAssistant";
import { PHASE_STOPS } from "./config";

// Parked at the Earth's rest: the assistant offers the next chapter, the Lab.
const earth = PHASE_STOPS.find((s) => s.id === "earth")?.target ?? 0.47;

const meta = {
  title: "Home/NavAssistant",
  component: NavAssistant,
  parameters: {
    layout: "fullscreen",
  },
  beforeEach: () => {
    useJourneyScroll.setState({ progress: earth });
    return () => useJourneyScroll.setState({ progress: 0 });
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
    const page = within(document.body);
    await expect(
      await page.findByRole("button", { name: "Next chapter: The Lab" }),
    ).toBeVisible();
  },
};

/** A click grows the dot into the next chapter's button; the label writes in. */
export const Opened: Story = {
  play: async () => {
    const page = within(document.body);
    await userEvent.click(
      await page.findByRole("button", { name: "Next chapter: The Lab" }),
    );
    await waitFor(
      () => expect(page.getByRole("button", { name: "The Lab" })).toBeVisible(),
      {
        timeout: 3000,
      },
    );
  },
};
