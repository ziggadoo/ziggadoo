/** Sends a plain-text email through Resend. Silently no-ops when RESEND_API_KEY isn't set, so forms still save to the database. */
export async function sendEmail({ subject, text, replyTo }: { subject: string; text: string; replyTo?: string | null }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const to = process.env.NOTIFY_EMAIL ?? "post@ziggadoo.com";
  const from = process.env.EMAIL_FROM ?? "Ziggadoo <post@ziggadoo.com>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Sends a plain-text email to any address (pass emails, venue magic links). */
export async function sendEmailTo(to: string, subject: string, text: string, replyTo?: string | null): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM ?? "Ziggadoo <post@ziggadoo.com>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
