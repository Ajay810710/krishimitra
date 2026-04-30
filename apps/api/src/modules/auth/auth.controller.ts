import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsString, Matches, Length } from 'class-validator';
import { AuthService } from './auth.service.js';

class RequestOtpDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone!: string;
}

class VerifyOtpDto {
  @IsString() phone!: string;
  @IsString() @Length(6, 6) code!: string;
}

class RefreshDto {
  @IsString() refreshToken!: string;
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
