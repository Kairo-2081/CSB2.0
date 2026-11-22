// Outgoing email for verification codes. Two ways to send:
//
// 1. BREVO_API_KEY: Brevo's HTTPS API (port 443). Works on hosts that block
//    the SMTP ports, such as Render's free plan. Used whenever it is set.
// 2. SMTP_URL: any SMTP server, e.g. smtps://user%40gmail.com:app-password@smtp.gmail.com:465.
//    Needs a host that allows outbound SMTP (Render's paid plans do).
//
// With neither set, nothing is sent and email verification stays off.
// SMTP_URL=json://outbox keeps messages in memory instead (used by the tests).
import nodemailer from 'nodemailer';
import { config } from './config.js';

export const outbox = [];
const toOutbox = !config.brevoApiKey && config.smtpUrl === 'json://outbox';
const transport = config.brevoApiKey || !config.smtpUrl
  ? null
  : toOutbox
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport(config.smtpUrl);

export const mailEnabled = Boolean(config.brevoApiKey || transport);

/** "CSB 2.0 <a@b.c>" -> { name: "CSB 2.0", email: "a@b.c" } */
export function parseAddress(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return match ? { name: match[1].replace(/^"|"$/g, '') || undefined, email: match[2].trim() } : { email: value.trim() };
}

async function sendWithBrevo({ to, toName, subject, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: parseAddress(config.mailFrom),
      to: [{ email: to, name: toName }],
      subject,
      textContent: text,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    // Brevo explains what is wrong (unverified sender, blocked IP, bad key) in the body.
    throw new Error(`Brevo refused the email (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
}

export async function sendVerificationCode({ email, name, code }) {
  const message = {
    to: email,
    toName: name,
    subject: `${code} is your CSB 2.0 code`,
    text: [
      `Hi ${name},`,
      '',
      `Your CSB 2.0 verification code is ${code}. It works for 15 minutes.`,
      '',
      'If you did not sign up for CSB 2.0, ignore this email.',
    ].join('\n'),
  };
  if (config.brevoApiKey) return sendWithBrevo(message);
  if (!transport) throw new Error('Email is not configured');
  const info = await transport.sendMail({ from: config.mailFrom, to: message.to, subject: message.subject, text: message.text });
  if (toOutbox) outbox.push(JSON.parse(info.message));
}
