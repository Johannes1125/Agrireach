import nodemailer from "nodemailer";

export type MailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST as string;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  if (!host || !user || !pass) throw new Error("SMTP env vars missing");
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(params: MailParams): Promise<void> {
  const from = process.env.SMTP_FROM || "AgriReach <no-reply@agrireach.local>";
  const t = getTransporter();
  await t.sendMail({ from, to: params.to, subject: params.subject, html: params.html, text: params.text });
}


