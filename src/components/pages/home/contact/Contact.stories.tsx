import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { CONTACT } from "#/components/pages/home/story/copy";
import { inCalm } from "#/stories/motion";
import Contact from "./Contact";
import { contactDraft, keepDraft } from "./draft";

/**
 * Contact, the site's last beat. Shown here as a page (the calm book's): over the journey
 * (`layout: "overlay"`) it waits hidden until the journey reveals it.
 */
const meta = {
  title: "Home/Contact",
  component: Contact,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: { layout: { control: false }, overlayRef: { control: false } },
  args: { layout: "page", titleId: "contact-title" },
} satisfies Meta<typeof Contact>;

export default meta;

type Story = StoryObj<typeof meta>;

/** As a page: the title and its swash, a warm line, the form and the links. */
export const Page: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveAttribute("id", "contact-title");
    await expect(canvas.getByRole("textbox", { name: CONTACT.fields.name.label })).toBeVisible();
    await expect(canvas.getByRole("button", { name: CONTACT.send })).toBeEnabled();
  },
};

/** Sent (in calm motion, as in the book): the thank-you fades in where the form was, and is announced. */
export const Sent: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: CONTACT.fields.name.label }), "Ada");
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.email.label }),
      "ada@example.com",
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.message.label }),
      "Hello!",
    );
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    const thanks = await canvas.findByRole("status", {}, { timeout: 3000 });
    await expect(thanks).toHaveTextContent(CONTACT.thanks.line);
    await waitFor(() => expect(thanks).toHaveStyle({ opacity: "1" }));
  },
};

/** A message being written when the modes switch is carried over (P27-94): the other mode's form opens with it. In memory only, and gone once sent. */
export const CarriedOver: Story = {
  beforeEach: () => {
    contactDraft.current = { name: "Ada", email: "", message: "Half a thought" };
    return () => {
      contactDraft.current = null;
    };
  },
  play: async ({ canvas, userEvent }) => {
    const email = canvas.getByRole("textbox", { name: CONTACT.fields.email.label });
    await expect(canvas.getByRole("textbox", { name: CONTACT.fields.name.label })).toHaveValue(
      "Ada",
    );
    await expect(canvas.getByRole("textbox", { name: CONTACT.fields.message.label })).toHaveValue(
      "Half a thought",
    );
    await expect(email).toHaveValue("");
    // Taken from the form again, as a switch does.
    await userEvent.type(email, "ada@example.com");
    keepDraft();
    await expect(contactDraft.current).toEqual({
      name: "Ada",
      email: "ada@example.com",
      message: "Half a thought",
    });
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    await canvas.findByRole("status", {}, { timeout: 3000 });
    await expect(contactDraft.current).toBeNull();
  },
};
