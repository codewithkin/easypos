import nodemailer from "nodemailer";
import { env } from "@easypos/env/server";

// ── Transporter ────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

// ── Base template ──────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EasyPOS</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#141414;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:20px;">🏪</span>
                </div>
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">EasyPOS</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #262626;text-align:center;">
              <p style="margin:0;font-size:12px;color:#525252;">
                © ${new Date().getFullYear()} EasyPOS · Point of Sale for Modern Businesses
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email: Invitation ──────────────────────────────────────────────

export async function sendInviteEmail(opts: {
  to: string;
  name: string;
  orgName: string;
  inviterName: string;
  role: string;
  temporaryPassword: string;
  appUrl: string;
}) {
  const roleLabel = opts.role === "MANAGER" ? "Manager" : "Staff";

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">
      You've been invited 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;line-height:1.6;">
      <strong style="color:#fafafa;">${opts.inviterName}</strong> has invited you to join
      <strong style="color:#fafafa;">${opts.orgName}</strong> on EasyPOS as a <strong style="color:#16a34a;">${roleLabel}</strong>.
    </p>

    <div style="background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:1px;">Your Credentials</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #262626;">
            <span style="font-size:13px;color:#737373;">Email</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #262626;text-align:right;">
            <span style="font-size:13px;font-weight:600;color:#fafafa;">${opts.to}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="font-size:13px;color:#737373;">Temporary Password</span>
          </td>
          <td style="padding:8px 0;text-align:right;">
            <code style="font-size:14px;font-weight:700;color:#16a34a;background:#0f2d1a;padding:4px 10px;border-radius:6px;border:1px solid #166534;">${opts.temporaryPassword}</code>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:13px;color:#737373;line-height:1.6;">
      ⚠️ You will be prompted to change your password on first login. Keep these credentials safe.
    </p>

    <a href="${opts.appUrl}"
       style="display:block;text-align:center;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
      Open EasyPOS →
    </a>
  `;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: opts.to,
    subject: `You've been invited to ${opts.orgName} on EasyPOS`,
    html: baseTemplate(content),
  });
}

// ── Email: Password Reset ──────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  code: string;
}) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">
      Reset your password
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#a3a3a3;line-height:1.6;">
      Hi <strong style="color:#fafafa;">${opts.name}</strong>, use the code below to reset your EasyPOS password.
      This code expires in <strong style="color:#fafafa;">15 minutes</strong>.
    </p>

    <div style="text-align:center;background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:32px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:2px;">Reset Code</p>
      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#16a34a;font-family:monospace;">${opts.code}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#525252;text-align:center;line-height:1.6;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: opts.to,
    subject: `Your EasyPOS password reset code: ${opts.code}`,
    html: baseTemplate(content),
  });
}
