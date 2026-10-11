import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { CONTACT } from "#/components/pages/home/story/copy";
import SkipToContact from "./SkipToContact";

/** "Skip to Contact": right after the Reduce motion switch in the page's controls (portalled to the body here). */
const meta = {
  title: "Home/SkipToContact",
  component: SkipToContact,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "8rem" } } },
} satisfies Meta<typeof SkipToContact>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Unseen until it has the focus, but always in the page for screen readers; Tab shows it beside the switch (it only fades in). */
export const Default: Story = {
  play: async ({ userEvent }) => {
    const link = within(document.body).getByRole("link", { name: CONTACT.skip });
    await expect(link).toHaveAttribute("href", "#contact");
    await expect(link).toHaveStyle({ opacity: "0" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(link).toHaveStyle({ opacity: "1" }));
  },
};
