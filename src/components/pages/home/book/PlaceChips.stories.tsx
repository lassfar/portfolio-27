import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import PanelHost from "#/components/pages/home/panel/PanelHost";
import { usePanelStore } from "#/stores/usePanelStore";
import { entered } from "#/stories/entered";
import { inCalm } from "#/stories/motion";
import { LabChip, PlaceChips } from "./PlaceChips";

const page = () => within(document.body);

/** The book's way into the panels: its chips, and the panel they open (portalled to the body). */
const meta = {
  title: "Home/Book/PlaceChips",
  component: PlaceChips,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { story: { inline: false, height: "30rem" } },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <PanelHost />
      </>
    ),
  ],
  // The book is calm: the panel only fades. Closed again for the next story.
  beforeEach: [
    inCalm,
    () => () => usePanelStore.setState({ content: null, view: "side", photo: null, opened: false }),
  ],
} satisfies Meta<typeof PlaceChips>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Earth's places, each with its count of shots. A click opens its photos; Escape closes them and the focus comes back to the chip. */
export const Places: Story = {
  play: async ({ canvas, userEvent }) => {
    const london = canvas.getByRole("button", { name: /London/ });
    await expect(london).toHaveTextContent("· 5 shots");
    await expect(london).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(london);
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(london).toHaveAttribute("aria-expanded", "true");
    await entered(panel);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(usePanelStore.getState().content).toBeNull());
    await waitFor(() => expect(london).toHaveFocus());
  },
};

/** Parker's memory card: it opens the Lab. */
export const Lab: Story = {
  render: () => <LabChip />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Memory card/ }));
    await entered(await page().findByRole("dialog", { name: /Card/ }));
  },
};
