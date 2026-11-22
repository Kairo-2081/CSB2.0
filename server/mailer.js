// Sends email when SMTP_URL is set (e.g. smtps://user:app-password@smtp.gmail.com:465).
// Without it, nothing is sent and email verification stays off.
import nodemailer from 'nodemailer';
import { config } from './config.js';

// SMTP_URL=json://outbox keeps messages in memory instead (used by the tests).
export const outbox = [];
const toOutbox = config.smtpUrl === 'json://outbox';
const transport = !config.smtpUrl
  ? null
  : toOutbox
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport(config.smtpUrl);

export const mailEnabled = Boolean(transport);

export async function sendVerificationCode({ email, name, code }) {
  if (!transport) throw new Error('SMTP is not configured');
  const info = await transport.sendMail({
    from: config.mailFrom,
    to: email,
    subject: `${code} is your CSB 2.0 code`,
    text: [
      `Hi ${name},`,
      '',
      `Your CSB 2.0 verification code is ${code}. It works for 15 minutes.`,
      '',
      'If you did not sign up for CSB 2.0, ignore this email.',
    ].join('\n'),
  });
  if (toOutbox) outbox.push(JSON.parse(info.message));
}
