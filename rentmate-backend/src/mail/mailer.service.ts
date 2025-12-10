import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly senderAddress?: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const secure =
      this.configService.get<string>('MAIL_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const emailDocsPath = 'docs/email-setup.md';

    this.senderAddress =
      this.configService.get<string>('MAIL_FROM') ||
      (user ? `RentMate <${user}>` : undefined);

    const isGmailHost = host.includes('gmail');
    if (isGmailHost && pass && !/^[A-Za-z0-9]{16}$/.test(pass.replace(/\s+/g, ''))) {
      this.logger.warn(
        'Gmail SMTP detected but MAIL_PASS is not a 16-character App Password. Follow the steps in ' +
          emailDocsPath +
          ' to create one, otherwise Google will reject the login.',
      );
    }

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn(
        'Mail credentials are missing. Email notifications are disabled.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.transporter && this.senderAddress);
  }

  async send(payload: MailPayload): Promise<void> {
    if (!this.transporter || !this.senderAddress) {
      this.logger.warn(
        `Mail transporter not configured. Unable to send email to ${payload.to}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.senderAddress,
        ...payload,
      });
    } catch (error) {
      this.logger.error(
        `Unable to send email to ${payload.to}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (this.isInvalidCredentialsError(error)) {
        this.logger.error(
          `SMTP authentication failed. Verify MAIL_USER/MAIL_PASS or use a Gmail App Password as described in docs/email-setup.md.`,
        );
      }
      throw error;
    }
  }

  private isInvalidCredentialsError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const code = (error as { code?: string }).code;
    const responseCode = (error as { responseCode?: number }).responseCode;

    return code === 'EAUTH' || responseCode === 535;
  }
}
