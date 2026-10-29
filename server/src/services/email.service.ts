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
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: delivery.email,
      subject: 'Reset your Fleetline password',
      text: 'Use this link to reset your Fleetline password: ' + link,
    });
  }
}
export const emailService: EmailService = env.SMTP_HOST
  ? new SmtpEmailService()
  : new DevelopmentEmailService();
