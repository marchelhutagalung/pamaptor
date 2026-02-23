import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

const FROM_EMAIL = process.env.SMTP_FROM || "Pamaptor <noreply@pamaptor.com>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter || process.env.NODE_ENV !== "production") {
    // Dev mode: log the email content instead of sending
    console.log("\n--- [DEV EMAIL] ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    const urlMatch = html.match(/href="([^"]+)"/);
    if (urlMatch) {
      console.log("Link:", urlMatch[1]);
    }
    console.log("-------------------\n");
    return;
  }

  await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/api/email/verify?token=${token}`;
  await sendEmail(
    to,
    "Verifikasi Akun Pamaptor",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verifikasi Akun Anda</h2>
      <p>Klik tombol di bawah untuk memverifikasi akun Pamaptor Anda.</p>
      <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Verifikasi Email
      </a>
      <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 24 jam.</p>
      <p style="color: #999; font-size: 12px;">Jika Anda tidak mendaftar di Pamaptor, abaikan email ini.</p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Reset Password Pamaptor",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Password</h2>
      <p>Klik tombol di bawah untuk mengatur ulang password Pamaptor Anda.</p>
      <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
      <p style="color: #999; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
    </div>
    `
  );
}
