import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

class RequestOtpDto {
  phone!: string;
}

class VerifyOtpDto {
  phone!: string;
  code!: string;
}

class RefreshDto {
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(body.phone, body.code);
    return { data };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshDto) {
    return this.authService.refreshTokens(body.refreshToken);
  }
}
