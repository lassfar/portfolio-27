import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, spyOn, waitFor, within } from "storybook/test";

import {
  CONTACT_EMAIL,
  CONTACT_MIN_FILL_MS,
  CONTACT_TRAP_FIELD,
} from "#/components/pages/home/contact/config";
import { CONTACT } from "#/components/pages/home/story/copy";
import { inCalm } from "#/stories/motion";
import Contact from "./Contact";
import { contactDraft, keepDraft } from "./draft";
import { SENT_KEY } from "./limit";

/** A made-up domain: the only one the faked DNS says takes no mail. */
const MADE_UP = "nowhere-at-all.xyz";

/** Cloudflare's DNS, faked (the email check asks it whether a domain takes mail). */
const fakeDns = () => {
  const dns = spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const name = new URL(String(input)).searchParams.get("name");
    const answer =
      name === MADE_UP
        ? { Status: 3 }
        : { Status: 0, Answer: [{ type: 15, data: `10 mx.${name}.` }] };
    return new Response(JSON.stringify(answer), { status: 200 });
  });
  return () => dns.mockRestore();
};

/** Each story starts with no message sent today, and the DNS faked. */
const fresh = () => {
  localStorage.removeItem(SENT_KEY);
  const undoDns = fakeDns();
  return () => {
    undoDns();
    localStorage.removeItem(SENT_KEY);
  };
};

/**
 * Contact, the site's last beat. Shown here as a page (the calm book's): over the journey
 * (`layout: "overlay"`) it waits hidden until the journey reveals it. Here a stand-in sends
 * (`send`; the site posts to Netlify Forms), and the DNS the email check asks is faked.
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
  beforeEach: fresh,
} satisfies Meta<typeof Contact>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A person takes a moment to write: a form sent faster counts as a bot's. */
const likeAPerson = () => new Promise((resolve) => setTimeout(resolve, CONTACT_MIN_FILL_MS));

/** The contact content has finished fading (out while the thank-you shows, else back in), so the a11y check that follows measures settled colours. */
const settled = (root: HTMLElement) =>
  waitFor(() => {
    const content = root.querySelector(".home-contact__content")!;
    expect(content).toHaveStyle({ opacity: content.hasAttribute("inert") ? "0" : "1" });
  });

/** As a page: the title and its swash, a warm line, the form and the links. */
export const Page: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveAttribute("id", "contact-title");
    await expect(canvas.getByRole("textbox", { name: CONTACT.fields.name.label })).toBeVisible();
    await expect(canvas.getByRole("button", { name: CONTACT.send })).toBeEnabled();
  },
};

/** Sent (in calm motion, as in the book): the message goes out, and the thank-you takes the contact content's place, announced, the links still under it; "Write another" brings the content back. */
export const Sent: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: CONTACT.fields.name.label }), "Ada");
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.email.label }),
      "ada@example.com",
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.message.label }),
      "Hello!",
    );
    await likeAPerson();
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    // Sent once the address is checked (a DNS lookup).
    await waitFor(() =>
      expect(args.send).toHaveBeenCalledWith({
        name: "Ada",
        email: "ada@example.com",
        message: "Hello!",
      }),
    );
    const thanks = await canvas.findByRole("status", {}, { timeout: 3000 });
    await expect(thanks).toHaveTextContent(CONTACT.thanks.line);
    await waitFor(() => expect(thanks).toHaveStyle({ opacity: "1" }));

    // The thank-you in the content's place: its heading the block's, the form gone, the links kept.
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveAccessibleName("Thank you");
    await expect(
      canvas.queryByRole("textbox", { name: CONTACT.fields.name.label }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /GitHub/ })).toBeVisible();
    const again = canvas.getByRole("button", { name: CONTACT.thanks.again });
    await waitFor(() => expect(again).toHaveFocus());
    await settled(canvasElement);

    // "Write another": the content back, the cursor in Name.
    await userEvent.click(again);
    const name = await canvas.findByRole("textbox", { name: CONTACT.fields.name.label });
    await waitFor(() => expect(name).toHaveFocus());
    await expect(name).toHaveValue("");
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveAttribute("id", "contact-title");
    await settled(canvasElement);
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
    await likeAPerson();
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

/** An address Aymane can't reply to: the reason under Email, the focus there, and nothing sent. A typo gets a one-tap fix. */
export const CheckedEmail: Story = {
  play: async ({ canvas, canvasElement, userEvent, args, step }) => {
    const email = canvas.getByRole("textbox", { name: CONTACT.fields.email.label });
    const send = () => userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    const turnedDown = async (address: string, reason: string) => {
      await userEvent.clear(email);
      await userEvent.type(email, address);
      await send();
      const said = await canvas.findByText(reason);
      await waitFor(() => expect(said).toBeVisible()); // (it fades in)
      await expect(email).toBeInvalid();
      await expect(email).toHaveFocus();
      await expect(args.send).not.toHaveBeenCalled();
    };
    await userEvent.type(canvas.getByRole("textbox", { name: CONTACT.fields.name.label }), "Ada");
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.message.label }),
      "Hello!",
    );
    await likeAPerson();

    await step("a typo: one tap fixes it", async () => {
      await userEvent.type(email, "ada@gmial.com");
      await send();
      const hint = await canvas.findByText(
        CONTACT.emailErrors.typo.replace("{address}", "ada@gmail.com"),
      );
      await waitFor(() => expect(hint).toBeVisible()); // (it fades in)
      await expect(email).toHaveFocus();
      await userEvent.click(canvas.getByRole("button", { name: CONTACT.emailErrors.useIt }));
      await expect(email).toHaveValue("ada@gmail.com");
      await expect(email).toBeValid();
      await expect(email).toHaveFocus();
    });

    await step("a throwaway inbox", () =>
      turnedDown("ada@mailinator.com", CONTACT.emailErrors.throwaway),
    );

    await step("a domain that takes no mail", () =>
      turnedDown(`ada@${MADE_UP}`, CONTACT.emailErrors.domain.replace("{domain}", MADE_UP)),
    );

    await step("an address Aymane can reply to goes", async () => {
      await userEvent.clear(email);
      await userEvent.type(email, "ada@lovelace.dev");
      await send();
      await waitFor(() =>
        expect(args.send).toHaveBeenCalledWith(
          expect.objectContaining({ email: "ada@lovelace.dev" }),
        ),
      );
      const thanks = await canvas.findByRole("status", {}, { timeout: 3000 });
      await waitFor(() => expect(thanks).toHaveStyle({ opacity: "1" }));
      await settled(canvasElement);
    });
  },
};

/** Two messages a day from one browser: the second goes, then a kind line and the email link, and Send waits for tomorrow. */
export const LimitReached: Story = {
  beforeEach: () => {
    localStorage.setItem(SENT_KEY, JSON.stringify([Date.now() - 60_000]));
  },
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    await expect(canvas.queryByText(CONTACT.limit.line, { exact: false })).toBeNull();
    await userEvent.type(canvas.getByRole("textbox", { name: CONTACT.fields.name.label }), "Ada");
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.email.label }),
      "ada@lovelace.dev",
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: CONTACT.fields.message.label }),
      "One more thing",
    );
    await likeAPerson();
    await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
    await waitFor(() => expect(args.send).toHaveBeenCalledTimes(1));
    await userEvent.click(await canvas.findByRole("button", { name: CONTACT.thanks.again }));

    const line = await canvas.findByRole("status");
    await expect(line).toHaveTextContent(CONTACT.limit.line);
    await expect(within(line).getByRole("link", { name: CONTACT.limit.email })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    await expect(canvas.getByRole("button", { name: CONTACT.send })).toBeDisabled();
    await waitFor(() => expect(line).toHaveStyle({ opacity: "1" }));
    await settled(canvasElement);
  },
};

/** A bot (it sends faster than a person writes, or fills the hidden field): it gets the thank-you, and nothing is sent. */
export const Bot: Story = {
  play: async ({ canvas, canvasElement, userEvent, args, step }) => {
    // Each field cleared first: user-event keeps its own copy of what it typed, which a form's
    // reset (after the first try) doesn't clear, so it would type after the old text.
    const fill = async () => {
      for (const [label, text] of [
        [CONTACT.fields.name.label, "Bot"],
        [CONTACT.fields.email.label, "bot@example.com"],
        [CONTACT.fields.message.label, "Buy now"],
      ]) {
        const field = canvas.getByRole("textbox", { name: label });
        await userEvent.clear(field);
        await userEvent.type(field, text);
      }
    };
    const thanks = async () => {
      const status = await canvas.findByRole("status", {}, { timeout: 3000 });
      await expect(status).toHaveTextContent(CONTACT.thanks.line);
      await expect(args.send).not.toHaveBeenCalled();
      await waitFor(() => expect(status).toHaveStyle({ opacity: "1" }));
      await settled(canvasElement);
    };

    await step("sent faster than anyone writes", async () => {
      await fill();
      await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
      await thanks();
    });

    await step("the hidden field filled", async () => {
      await userEvent.click(canvas.getByRole("button", { name: CONTACT.thanks.again }));
      const trap = canvasElement.querySelector<HTMLInputElement>(`[name="${CONTACT_TRAP_FIELD}"]`)!;
      await expect(trap).not.toBeVisible();
      trap.value = "http://spam.example";
      await fill();
      await likeAPerson();
      await userEvent.click(canvas.getByRole("button", { name: CONTACT.send }));
      await thanks();
    });
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
  play: async ({ canvas, canvasElement, userEvent }) => {
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
    await settled(canvasElement);
  },
};
