import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { VerificationCode } from './entities/verification-code.entity';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { VerificationChannel } from '../common/enums/verification-channel.enum';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mail/mailer.service';

const CODE_EXPIRATION_MINUTES = 10;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class VerificationCodesService {
  private readonly logger = new Logger(VerificationCodesService.name);

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationRepository: Repository<VerificationCode>,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) { }

  async requestVerificationCode(
    dto: RequestVerificationDto,
  ): Promise<VerificationCode> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    this.ensureGmailAddress(normalizedEmail);
    await this.ensureUserDoesNotExist(normalizedEmail);
    await this.ensureNotRequestedTooSoon(normalizedEmail);

    const channel = VerificationChannel.Email;
    const phone = this.normalizePhone(dto.phone);
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(
      Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000,
    );

    const verification = this.verificationRepository.create({
      email: normalizedEmail,
      phone,
      channel,
      codeHash,
      expiresAt,
    });
    await this.verificationRepository.save(verification);

    await this.dispatchEmail(normalizedEmail, code);

    this.logger.log(
      `Created verification ${verification.id} for ${normalizedEmail} via ${channel}`,
    );
    return verification;
  }

  async verifyCode(dto: VerifyCodeDto): Promise<VerificationCode> {
    const record = await this.verificationRepository.findOne({
      where: { id: dto.verificationId },
    });

    if (!record) {
      throw new NotFoundException('Verification request not found');
    }

    this.ensureNotExpired(record);
    if (record.isUsed) {
      throw new BadRequestException('Verification already used');
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Request a new code.',
      );
    }

    const isValid = await bcrypt.compare(dto.code, record.codeHash);
    record.attempts += 1;

    if (!isValid) {
      await this.verificationRepository.save(record);
      throw new BadRequestException('Verification code is incorrect');
    }

    record.verifiedAt = new Date();
    await this.verificationRepository.save(record);
    return record;
  }

  async assertVerifiedAndUnused(
    verificationId: string,
    email: string,
    phone: string,
  ): Promise<VerificationCode> {
    const record = await this.verificationRepository.findOne({
      where: { id: verificationId },
    });
    if (!record) {
      throw new NotFoundException('Verification request not found');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPhone = this.normalizePhone(phone);

    if (record.email !== normalizedEmail) {
      throw new BadRequestException('Verification email does not match');
    }
    if (record.phone !== normalizedPhone) {
      throw new BadRequestException('Verification phone does not match');
    }
    if (!record.verifiedAt) {
      throw new BadRequestException('Verification code has not been confirmed');
    }
    if (record.isUsed) {
      throw new BadRequestException('Verification has already been used');
    }
    this.ensureNotExpired(record);

    return record;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.verificationRepository.update(id, {
      isUsed: true,
    });
    await this.cleanupExpired();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
  }

  private ensureGmailAddress(email: string) {
    if (!email.endsWith('@gmail.com')) {
      throw new BadRequestException(
        'Only gmail.com addresses are supported for registration',
      );
    }
  }

  private async ensureUserDoesNotExist(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      throw new ConflictException('Email already exists');
    }
  }

  private async ensureNotRequestedTooSoon(email: string) {
    const recent = await this.verificationRepository.findOne({
      where: {
        email,
        createdAt: MoreThan(new Date(Date.now() - RESEND_WINDOW_MS)),
      },
      order: { createdAt: 'DESC' },
    });

    if (recent) {
      throw new BadRequestException(
        'Please wait a moment before requesting another code',
      );
    }
  }

  private ensureNotExpired(record: VerificationCode) {
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }
  }

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private async dispatchEmail(email: string, code: string) {
    const expiresAt = CODE_EXPIRATION_MINUTES;
    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;background-color:#f9fafb;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
          <h2 style="color:#0f172a;margin:0 0 16px;">RentMate Verification</h2>
          <p style="color:#334155;margin:0 0 12px;">Use the code below to finish creating your RentMate account.</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:8px;color:#2563eb;text-align:center;margin:24px 0;">
            ${code}
          </div>
          <p style="color:#475569;margin:0 0 8px;">The code expires in ${expiresAt} minutes.</p>
          <p style="color:#94a3b8;margin:0;">If you didn't request this message, you can safely ignore it.</p>
        </div>
      </div>
    `;

    await this.mailerService.send({
      to: email,
      subject: 'Your RentMate verification code',
      html,
    });
  }

  private async cleanupExpired() {
    const threshold = new Date(Date.now() - CODE_EXPIRATION_MINUTES * 60 * 1000);
    await this.verificationRepository.delete({
      isUsed: true,
      updatedAt: LessThan(threshold),
    });
  }
}
