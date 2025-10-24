import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        token: result.token,
      },
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    await this.authService.logout();
    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
