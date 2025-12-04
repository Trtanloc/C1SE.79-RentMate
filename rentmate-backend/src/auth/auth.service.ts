import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { VerificationCodesService } from '../verification-codes/verification-codes.service';
import { UserRole } from '../common/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import { FacebookLoginDto } from './dto/facebook-login.dto';

type JwtPayload = {
  sub: number;
  email: string;
  role: string;
};

const sanitizeUser = (user: User) => {
  const { password, ...rest } = user;
  return rest;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly verificationCodesService: VerificationCodesService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.toLowerCase();
    await this.verificationCodesService.assertVerifiedAndUnused(
      registerDto.verificationId,
      normalizedEmail,
      registerDto.phone,
    );

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: registerDto.phone,
      role: UserRole.Tenant,
      emailVerifiedAt: new Date(),
    });

    await this.verificationCodesService.markAsUsed(registerDto.verificationId);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);
    return {
      token,
      user: sanitizeUser(user),
    };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.getExpiry(loginDto.remember) as JwtSignOptions['expiresIn'],
    });

    return {
      token,
      expiresAt: this.resolveExpiresAt(loginDto.remember),
      user: sanitizeUser(user),
    };
  }

  async logout() {
    // Stateless JWT logout stub; client should discard token.
    return { message: 'Logout successful' };
  }

  private getExpiry(remember?: boolean): string | number {
    if (remember) {
      return (
        this.configService.get<string>('JWT_REMEMBER_EXPIRES_IN') || '30d'
      );
    }
    return this.configService.get<string>('JWT_EXPIRES_IN') || '1d';
  }

  private resolveExpiresAt(remember?: boolean) {
    const days = remember ? 30 : 1;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    return expires.toISOString();
  }

  async loginWithFacebook(dto: FacebookLoginDto) {
    const graphBase =
      this.configService.get<string>('FACEBOOK_GRAPH_URL') ??
      'https://graph.facebook.com';
    const fields = 'id,name,email,picture';
    const requestUrl = `${graphBase}/me?fields=${fields}&access_token=${encodeURIComponent(dto.accessToken)}`;

    let profile: { id: string; name?: string; email?: string; picture?: any };
    try {
      const response = await axios.get(requestUrl, { timeout: 5000 });
      profile = response.data;
    } catch (error: any) {
      throw new UnauthorizedException(
        error?.response?.data?.error?.message ||
          'Unable to verify Facebook access token',
      );
    }

    if (!profile?.id) {
      throw new UnauthorizedException('Invalid Facebook profile');
    }

    const email = profile.email?.toLowerCase() ?? `fb-${profile.id}@facebook.com`;
    const fullName = profile.name || 'Facebook User';
    const avatarUrl =
      dto.avatarUrl ||
      profile.picture?.data?.url ||
      profile.picture?.url ||
      undefined;

    let user = await this.usersService.findByFacebookId(profile.id);
    if (!user) {
      user = await this.usersService.findByEmail(email);
    }

    if (!user) {
      const hashed = await bcrypt.hash(randomBytes(12).toString('hex'), 10);
      user = await this.usersService.create({
        fullName,
        email,
        password: hashed,
        phone: '',
        role: UserRole.Tenant,
        avatarUrl,
        emailVerifiedAt: new Date(),
        facebookId: profile.id,
      } as any);
    } else if (!user.facebookId) {
      await this.usersService.update(user.id, {
        facebookId: profile.id,
        avatarUrl: avatarUrl ?? user.avatarUrl,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      });
      user = await this.usersService.findById(user.id);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.getExpiry(true) as JwtSignOptions['expiresIn'],
    });

    return {
      token,
      expiresAt: this.resolveExpiresAt(true),
      user: sanitizeUser(user),
    };
  }
}
