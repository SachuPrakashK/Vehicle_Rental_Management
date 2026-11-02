import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
export interface PasswordResetDelivery {
  email: string;
  token: string;
}
export interface EmailService {
  sendPasswordReset(delivery: PasswordResetDelivery): Promise<void>;
}
class DevelopmentEmailService implements EmailService {
  async sendPasswordReset(_delivery: PasswordResetDelivery): Promise<void> {
    return Promise.resolve();
  }
}
class SmtpEmailService implements EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  async sendPasswordReset(delivery: PasswordResetDelivery): Promise<void> {
    const link =
      env.FRONTEND_ORIGIN + '/auth/reset-password?token=' + encodeURIComponent(delivery.token);
    const result = await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: delivery.email,
      subject: 'Reset your Fleetline password',
      text: [
        'Reset your Fleetline password',
        '',
        `Use this secure link within ${env.PASSWORD_RESET_TTL_MINUTES} minutes:`,
        link,
        '',
        'If you did not request this change, you can safely ignore this email.',
      ].join('\n'),
      html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8f9fd;font-family:Arial,sans-serif;color:#1f2937">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f8f9fd">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
          <tr><td style="padding:28px 32px;background:#f0edff;color:#6541e7;font-size:22px;font-weight:700">Fleetline</td></tr>
          <tr><td style="padding:32px">
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3">Reset your password</h1>
            <p style="margin:0 0 24px;color:#596273;line-height:1.7">We received a request to reset your Fleetline password. This secure link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes and can be used only once.</p>
            <a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#6541e7;color:#ffffff;text-decoration:none;font-weight:600">Reset password</a>
            <p style="margin:24px 0 0;color:#596273;font-size:13px;line-height:1.6">If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    });
    const accepted = result.accepted.map(String);
    if (!accepted.includes(delivery.email))
      throw new Error('Email provider did not accept recipient.');
  }
}
export const emailService: EmailService = env.SMTP_HOST
  ? new SmtpEmailService()
  : new DevelopmentEmailService();
