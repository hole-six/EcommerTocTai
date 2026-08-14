import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail(to: string, subject: string, html: string) {
  const client = getTransporter();
  if (!client) throw new Error("Email chưa được cấu hình trên server.");
  await client.sendMail({
    from: `"Tóc Tai (Không phản hồi)" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
