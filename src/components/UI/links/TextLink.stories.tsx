import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import Gallery from "#/stories/Gallery";
import TextLink from "./TextLink";
import { TEXT_LINK_VARIANTS, type TextLinkProps } from "./link.types";

const meta = {
  title: "UI/TextLink",
  component: TextLink,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { variant: { control: "inline-radio", options: TEXT_LINK_VARIANTS } },
  args: { children: "Email", href: "mailto:hello@example.com" },
} satisfies Meta<typeof TextLink>;

export default meta;

// Its props are a union (a link or a button), which `typeof meta` can't infer stories from:
// so they're typed by the props, and their plays name their context.
type Story = StoryObj<TextLinkProps>;
type Context = StoryContext<TextLinkProps>;

/** A quiet link: peach on hover or keyboard focus. */
export const Default: Story = {
  play: async ({ canvas }: Context) => {
    const link = canvas.getByRole("link", { name: "Email" });
    await expect(link).toHaveAttribute("href", "mailto:hello@example.com");
    await expect(link).not.toHaveAttribute("target");
  },
};

/** `external`: another site, in a new tab. */
export const External: Story = {
  args: { children: "GitHub", href: "https://github.com/lassfar", external: true },
  play: async ({ canvas }: Context) => {
    const link = canvas.getByRole("link", { name: "GitHub" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

/** Without `href`: a button that does something here ("Write another"). */
export const AsButton: Story = {
  args: { children: "Write another", href: undefined, variant: "caps", onClick: fn() },
  play: async ({ canvas, userEvent, args }: Context) => {
    await userEvent.click(canvas.getByRole("button", { name: "Write another" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** `plain` in a list of links, `caps` for a quiet action under a form. */
export const Variants: Story = {
  parameters: { controls: { exclude: ["variant"] } },
  render: (args: TextLinkProps) => (
    <Gallery values={TEXT_LINK_VARIANTS}>{(variant) => <TextLink {...args} variant={variant} />}</Gallery>
  ),
};
