import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerificationCodesService } from '../verification-codes/verification-codes.service';
import { RequestVerificationDto } from '../verification-codes/dto/request-verification.dto';
import { VerifyCodeDto } from '../verification-codes/dto/verify-code.dto';
import { PasswordResetsService } from '../password-resets/password-resets.service';
import { RequestResetDto } from '../password-resets/dto/request-reset.dto';
import { PerformResetDto } from '../password-resets/dto/perform-reset.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationCodesService: VerificationCodesService,
    private readonly passwordResetsService: PasswordResetsService,
  ) {}

  @Post('register/request-code')
  async sendVerificationCode(@Body() dto: RequestVerificationDto) {
    const verification =
      await this.verificationCodesService.requestVerificationCode(dto);
    return {
      success: true,
      message: 'Verification code sent successfully',
      data: {
        verificationId: verification.id,
        expiresAt: verification.expiresAt,
      },
    };
  }

  @Post('register/verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const verification = await this.verificationCodesService.verifyCode(dto);
    return {
      success: true,
      message: 'Verification confirmed',
      data: {
        verificationId: verification.id,
        verifiedAt: verification.verifiedAt,
      },
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('facebook')
  async redirectToFacebook(
    @Res() res: Response,
    @Query('state') state?: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const url = this.authService.buildFacebookAuthUrl({ state, returnUrl });
    return res.redirect(url);
  }

  @Get('facebook/callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Query('state') state = '',
    @Res() res: Response,
  ) {
    const { token, expiresAt } =
      await this.authService.handleFacebookCallback(code, state);
    const redirectUrl = this.authService.buildFacebookSuccessRedirect(
      token,
      expiresAt,
      state,
    );
    return res.redirect(redirectUrl);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestResetDto) {
    await this.passwordResetsService.request(dto);
    return {
      success: true,
      message:
        'If an account exists for that email, a reset link has been sent',
      data: null,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: PerformResetDto) {
    await this.passwordResetsService.perform(dto);
    return { success: true, message: 'Password reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    const result = await this.authService.logout();
    return { success: true, message: result.message, data: null };
  }

  
}
