import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import TextLink from "./TextLink";
import type { TextLinkProps } from "./link.types";

const meta = {
  title: "UI/TextLink",
  component: TextLink,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex justify-center p-10">
        <Story />
      </div>
    ),
  ],
  args: { children: "Email", href: "mailto:hello@example.com" },
} satisfies Meta<typeof TextLink>;

export default meta;

// Its props are a union (a link or a button), which `typeof meta` can't infer from; so its plays name their context's type.
type Story = StoryObj<TextLinkProps>;

/** A quiet link in a list (Contact's links); peach on hover or keyboard focus. */
export const Plain: Story = {
  play: async ({ canvasElement }: StoryContext<TextLinkProps>) => {
    const link = within(canvasElement).getByRole("link", { name: "Email" });
    await expect(link).toHaveAttribute("href", "mailto:hello@example.com");
    await expect(link).not.toHaveAttribute("target");
  },
};

/** Another site: in a new tab. */
export const External: Story = {
  args: { children: "GitHub", href: "https://github.com/lassfar", external: true },
  play: async ({ canvasElement }: StoryContext<TextLinkProps>) => {
    const link = within(canvasElement).getByRole("link", { name: "GitHub" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

/** Without `href`: a button, in small spaced capitals ("Write another"). */
export const CapsButton: Story = {
  args: { children: "Write another", href: undefined, variant: "caps", onClick: fn() },
  play: async ({ canvasElement, args }: StoryContext<TextLinkProps>) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Write another" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
