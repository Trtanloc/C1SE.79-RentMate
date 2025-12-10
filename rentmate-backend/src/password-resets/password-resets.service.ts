import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordReset } from './entities/password-reset.entity';
import { RequestResetDto } from './dto/request-reset.dto';
import { PerformResetDto } from './dto/perform-reset.dto';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mail/mailer.service';
import { ConfigService } from '@nestjs/config';

const DEFAULT_EXP_MINUTES = 30;

@Injectable()
export class PasswordResetsService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async request(dto: RequestResetDto): Promise<void> {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      // Avoid account enumeration by returning generic success.
      await this.delayForEnumerationProtection();
      return;
    }

    const minutes =
      Number(
        this.configService.get<string>(
          'PASSWORD_RESET_EXP_MINUTES',
          `${DEFAULT_EXP_MINUTES}`,
        ),
      ) || DEFAULT_EXP_MINUTES;

    // Keep only one active token per user to reduce attack surface.
    await this.passwordResetRepository.delete({ email: user.email });

    const token = this.generateToken();
    if (!token) {
      throw new BadRequestException('Could not generate reset token');
    }
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    const reset = this.passwordResetRepository.create({
      email: user.email,
      tokenHash,
      expiresAt,
    });
    await this.passwordResetRepository.save(reset);
    const resetUrl = this.buildResetUrl(token);
    await this.dispatchEmail(user.email, token, resetUrl, minutes);
  }

  async perform(dto: PerformResetDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const tokenHash = this.hashToken(dto.token);
    const reset = await this.passwordResetRepository.findOne({
      where: {
        tokenHash,
        expiresAt: MoreThan(new Date()),
        usedAt: null,
      },
    });
    if (!reset) {
      throw new BadRequestException('Reset token is invalid or expired');
    }
    if (reset.usedAt) {
      throw new BadRequestException('Reset token already used');
    }

    const user = await this.usersService.findByEmail(reset.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.usersService.update(user.id, { password: hashedPassword });
    reset.usedAt = new Date();
    await this.passwordResetRepository.save(reset);
    await this.passwordResetRepository.delete({ email: reset.email });
    return { success: true };
  }

  private generateToken() {
    return randomBytes(24).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async delayForEnumerationProtection() {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  private async dispatchEmail(
    email: string,
    token: string,
    resetUrl: string,
    minutes: number,
  ) {
    await this.mailerService.send({
      to: email,
      subject: 'Reset your RentMate password',
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;background-color:#f8fafc;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
            <h2 style="margin:0 0 12px;color:#0f172a;">Reset your RentMate password</h2>
            <p style="margin:0 0 12px;color:#334155;">Click the link below to set a new password. This link expires in ${minutes} minutes.</p>
            <p style="margin:16px 0;"><a href="${resetUrl}" style="background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Reset password</a></p>
            <p style="margin:12px 0;color:#475569;">If the button doesn't work, copy this URL:</p>
            <p style="word-break:break-all;color:#0f172a;">${resetUrl}</p>
            <p style="margin:12px 0;color:#475569;">Or paste this token in the reset form:</p>
            <p style="padding:10px 12px;background:#f1f5f9;border-radius:8px;border:1px dashed #cbd5e1;word-break:break-all;color:#0f172a;">${token}</p>
          </div>
        </div>
      `,
    });
  }

  private buildResetUrl(token: string) {
    const appBase = this.configService.get<string>(
      'APP_BASE_URL',
      'http://localhost:5173',
    );
    const normalized = appBase.endsWith('/')
      ? appBase.slice(0, -1)
      : appBase;
    return `${normalized}/forgot-password?token=${encodeURIComponent(token)}`;
  }
}
