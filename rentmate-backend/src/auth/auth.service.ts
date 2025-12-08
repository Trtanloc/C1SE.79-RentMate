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

type JwtPayload = {
  sub: number;
  email: string;
  role: string;
};

type FacebookProfile = {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string }; url?: string };
};

type EncodedState = {
  returnUrl?: string;
  payload?: string;
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

    return this.issueToken(user, true);
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
    return this.issueToken(user, loginDto.remember);
  }

  async logout() {
    // Stateless JWT logout stub; client should discard token.
    return { message: 'Logout successful' };
  }

  buildFacebookAuthUrl(params: { state?: string; returnUrl?: string } = {}) {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    if (!appId) {
      throw new UnauthorizedException('Facebook login is not configured');
    }
    const redirectUri = this.getFacebookRedirectUri();
    const url = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'email,public_profile');

    const encodedState = this.encodeState(params.state, params.returnUrl);
    if (encodedState) {
      url.searchParams.set('state', encodedState);
    }
    return url.toString();
  }

  async handleFacebookCallback(code: string, rawState?: string) {
    if (!code) {
      throw new UnauthorizedException('Missing Facebook authorization code');
    }
    const accessToken = await this.exchangeFacebookCode(code);
    const profile = await this.fetchFacebookProfile(accessToken);
    const user = await this.upsertFacebookUser(profile);
    return this.issueToken(user, true);
  }

  buildFacebookSuccessRedirect(
    token: string,
    expiresAt: string,
    rawState?: string,
  ) {
    const frontendBase =
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:5173';
    const normalized = frontendBase.endsWith('/')
      ? frontendBase.slice(0, -1)
      : frontendBase;

    const parsedState = this.parseState(rawState);
    const params = new URLSearchParams({ token });
    if (expiresAt) {
      params.set('expiresAt', expiresAt);
    }
    if (parsedState?.returnUrl) {
      params.set('returnUrl', parsedState.returnUrl);
    }
    return `${normalized}/auth/success?${params.toString()}`;
  }

  private async issueToken(user: User, remember = true) {
    const payload = this.buildJwtPayload(user);
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.getExpiry(remember) as JwtSignOptions['expiresIn'],
    });

    return {
      token,
      expiresAt: this.resolveExpiresAt(remember),
      user: sanitizeUser(user),
    };
  }

  private buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
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

  private getFacebookRedirectUri() {
    const explicit = this.configService.get<string>('FACEBOOK_REDIRECT_URI');
    if (explicit) {
      return explicit;
    }
    const apiBase =
      this.configService.get<string>('API_BASE_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}`;
    const normalizedBase = apiBase.endsWith('/')
      ? apiBase.slice(0, -1)
      : apiBase;
    const apiRoot = normalizedBase.endsWith('/api')
      ? normalizedBase
      : `${normalizedBase}/api`;
    return `${apiRoot}/auth/facebook/callback`;
  }

  private encodeState(state?: string, returnUrl?: string): string | undefined {
    const payload: EncodedState = {};
    if (state) {
      payload.payload = state;
    }
    if (returnUrl) {
      payload.returnUrl = returnUrl;
    }
    if (Object.keys(payload).length === 0) {
      return undefined;
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private parseState(raw?: string): EncodedState | null {
    if (!raw) return null;
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as EncodedState;
      return parsed;
    } catch {
      return null;
    }
  }

  private async exchangeFacebookCode(code: string): Promise<string> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook login is not configured');
    }

    const graphBase =
      this.configService.get<string>('FACEBOOK_GRAPH_URL') ??
      'https://graph.facebook.com';
    const redirectUri = this.getFacebookRedirectUri();
    const tokenUrl = `${graphBase}/v18.0/oauth/access_token`;

    try {
      const { data } = await axios.get(tokenUrl, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
        timeout: 5000,
      });
      if (!data?.access_token) {
        throw new UnauthorizedException('Facebook access token missing');
      }
      return data.access_token;
    } catch (error: any) {
      throw new UnauthorizedException(
        error?.response?.data?.error?.message ||
          'Unable to exchange Facebook authorization code',
      );
    }
  }

  private async fetchFacebookProfile(accessToken: string): Promise<FacebookProfile> {
    const graphBase =
      this.configService.get<string>('FACEBOOK_GRAPH_URL') ??
      'https://graph.facebook.com';
    const fields = 'id,name,email,picture';
    const requestUrl = `${graphBase}/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;

    try {
      const response = await axios.get(requestUrl, { timeout: 5000 });
      if (!response.data?.id) {
        throw new UnauthorizedException('Invalid Facebook profile response');
      }
      return response.data;
    } catch (error: any) {
      throw new UnauthorizedException(
        error?.response?.data?.error?.message ||
          'Unable to fetch Facebook profile',
      );
    }
  }

  private async upsertFacebookUser(profile: FacebookProfile): Promise<User> {
    const email =
      profile.email?.toLowerCase() ?? `fb-${profile.id}@facebook.com`;
    const fullName = profile.name || 'Facebook User';
    const avatarUrl =
      profile.picture?.data?.url || profile.picture?.url || undefined;

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

    return user;
  }
}
