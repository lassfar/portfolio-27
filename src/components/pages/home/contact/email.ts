/**
 * Is it an address Aymane can reply to? (P27-66) Checked in the browser before a message is
 * sent: the format, a throwaway inbox, a likely typo in a common domain, and whether the
 * domain takes mail at all (a DNS lookup of the part after @ only, through Cloudflare).
 */

/** What's wrong with an address, or nothing. */
export type EmailCheck =
  | { ok: true }
  | { ok: false; reason: "format" | "throwaway" | "domain"; domain: string }
  | { ok: false; reason: "typo"; suggestion: string };

/** Looks up whether a domain takes mail: true when it does, or when the lookup can't tell. */
export type MailLookup = (domain: string) => Promise<boolean>;

/** local@domain.tld: something before the @, a domain with a dot, a top-level part of 2+. */
const FORMAT = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/u;

/** The best-known throwaway inboxes (and their subdomains). */
const THROWAWAY = new Set([
  "10minutemail.com",
  "burnermail.io",
  "discard.email",
  "dispostable.com",
  "emailondeck.com",
  "emailfake.com",
  "fakeinbox.com",
  "fakemail.net",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mail.tm",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mailpoof.com",
  "minuteinbox.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "tempail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempr.email",
  "throwawaymail.com",
  "tmpmail.org",
  "trashmail.com",
  "yopmail.com",
]);

/** The domains most addresses use: a near miss of one is likely a typo. */
const COMMON = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "hotmail.fr",
  "outlook.fr",
  "yahoo.fr",
  "orange.fr",
  "free.fr",
  "gmx.de",
  "web.de",
];

/** The domain of an address, lower-case. */
export const domainOf = (address: string) =>
  address.slice(address.lastIndexOf("@") + 1).toLowerCase();

/** How many edits (insert, delete, change, swap two neighbours) turn `a` into `b`. */
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const change = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + change);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/** A common domain the address likely meant ("gmial.com" → "gmail.com"), if any. */
export function likelyDomain(domain: string): string | null {
  if (COMMON.includes(domain)) return null;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const common of COMMON) {
    const distance = editDistance(domain, common);
    // Short domains get one edit, longer ones two: "me.com" mustn't become everything.
    if (distance <= (common.length > 6 ? 2 : 1) && distance < bestDistance) {
      best = common;
      bestDistance = distance;
    }
  }
  return best;
}

/** Cloudflare's DNS-over-HTTPS (it answers browsers: CORS *). */
const DNS_URL = "https://cloudflare-dns.com/dns-query";
const MX = 15;
const A = 1;
/** A lookup slower than this can't tell (ms): the message goes. */
const LOOKUP_TIMEOUT_MS = 3000;

type DnsAnswer = { Status: number; Answer?: { type: number; data: string }[] };

const query = async (domain: string, type: "MX" | "A"): Promise<DnsAnswer> => {
  const url = `${DNS_URL}?name=${encodeURIComponent(domain)}&type=${type}`;
  const response = await fetch(url, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`DNS answered ${response.status}`);
  return response.json();
};

/**
 * Does the domain take mail? Its mail servers (MX), or else an address (A: mail goes there);
 * not when it doesn't exist, or says it takes none (a "null MX", like example.com). When the
 * lookup fails or is slow, it can't tell, and says yes: a message is never lost to it.
 */
export const lookupMail: MailLookup = async (domain) => {
  try {
    const mx = await query(domain, "MX");
    if (mx.Status === 3) return false; // no such domain
    const servers = (mx.Answer ?? []).filter((a) => a.type === MX);
    if (servers.length) return servers.some((a) => !/^0 \.$/.test(a.data.trim()));
    const host = await query(domain, "A");
    return (host.Answer ?? []).some((a) => a.type === A);
  } catch {
    return true;
  }
};

/**
 * Checks an address, cheapest first: its format, a throwaway inbox, a likely typo (unless the
 * visitor kept their address after the hint: `typoKept`), then whether its domain takes mail.
 */
export async function checkEmail(
  address: string,
  { typoKept = false, lookup = lookupMail }: { typoKept?: boolean; lookup?: MailLookup } = {},
): Promise<EmailCheck> {
  const email = address.trim();
  const domain = domainOf(email);
  if (!FORMAT.test(email)) return { ok: false, reason: "format", domain };
  if ([...THROWAWAY].some((d) => domain === d || domain.endsWith(`.${d}`)))
    return { ok: false, reason: "throwaway", domain };
  const likely = typoKept ? null : likelyDomain(domain);
  if (likely)
    return {
      ok: false,
      reason: "typo",
      suggestion: `${email.slice(0, email.lastIndexOf("@"))}@${likely}`,
    };
  if (!(await lookup(domain))) return { ok: false, reason: "domain", domain };
  return { ok: true };
}
