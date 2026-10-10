import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor, within } from "storybook/test";

import { CONTACT_EMAIL } from "#/components/pages/home/contact/config";
import { CONTACT } from "#/components/pages/home/story/copy";
import { inCalm } from "#/stories/motion";
import Contact from "./Contact";
import { contactDraft, keepDraft } from "./draft";

/**
 * Contact, the site's last beat. Shown here as a page (the calm book's): over the journey
 * (`layout: "overlay"`) it waits hidden until the journey reveals it. Here a stand-in sends
 * (`send`); the site posts to Netlify Forms.
 */
const meta = {
  title: "Home/Contact",
  component: Contact,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: {
    layout: { control: false },
    overlayRef: { control: false },
    send: { control: false },
  },
  args: { layout: "page", titleId: "contact-title", send: fn(async () => {}) },
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

/** Sent (in calm motion, as in the book): the message goes out, and the thank-you fades in where the form was, announced. */
export const Sent: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, userEvent, args }) => {
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
    await expect(args.send).toHaveBeenCalledWith({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello!",
    });
    const thanks = await canvas.findByRole("status", {}, { timeout: 3000 });
    await expect(thanks).toHaveTextContent(CONTACT.thanks.line);
    await waitFor(() => expect(thanks).toHaveStyle({ opacity: "1" }));
  },
};

/** Sending failed (offline, a failed post): a line says so, the message stays in the form, Send works again, and a link opens the visitor's mail app with the message. */
export const Failed: Story = {
  args: {
    send: fn(async () => {
      throw new Error("Offline");
    }),
  },
  play: async ({ canvas, userEvent, args }) => {
    const message = canvas.getByRole("textbox", { name: CONTACT.fields.message.label });
    await userEvent.type(canvas.getByRole("textbox", { name: CONTACT.fields.name.label }), "Ada");
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.email.label }),
      "ada@example.com",
    );
    await userEvent.type(message, "Hello & goodbye");
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent(CONTACT.failed.line);
    await expect(message).toHaveValue("Hello & goodbye");
    const mail = within(alert).getByRole("link", { name: CONTACT.failed.email });
    const href = mail.getAttribute("href") ?? "";
    await expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    await expect(href).toContain(encodeURIComponent("Hello & goodbye"));

    // Send works again.
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    await waitFor(() => expect(args.send).toHaveBeenCalledTimes(2));
    const again = await canvas.findByRole("alert");
    await waitFor(() => expect(again).toHaveStyle({ opacity: "1" }));
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
