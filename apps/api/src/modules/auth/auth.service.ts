/**
 * AuthService — handles OTP generation, verification, and JWT token issuance.
 * All authentication logic lives here; the controller is a thin HTTP adapter.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';

import { PrismaService } from '../database/prisma.service.js';
import type { JwtPayload } from './decorators/current-farmer.decorator.js';

/** Response returned after OTP verification */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  farmer: {
    id: string;
    phone: string;
    name: string;
    preferredLanguage: string;
    isVerified: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a 6-digit OTP for the given phone number.
   * Creates or retrieves the farmer record first.
   * In production this would send the OTP via an SMS provider.
   */
  async requestOtp(phone: string): Promise<{ message: string }> {
    // Invalidate any existing unused OTPs for this phone
    await this.prismaService.otp.updateMany({
      where: { phone, isUsed: false },
      data: { isUsed: true },
    });

    // In development use a fixed OTP for easy testing
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    const code = isDev ? '000000' : String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Find or create the farmer
    let farmer = await this.prismaService.farmer.findUnique({ where: { phone } });
    if (!farmer) {
      farmer = await this.prismaService.farmer.create({
        data: { phone, name: 'Farmer', preferredLanguage: 'HINDI' },
      });
    }

    await this.prismaService.otp.create({
      data: { farmerId: farmer.id, phone, code, expiresAt },
    });

    // In production: await smsProvider.sendOtp(phone, code);
    this.logger.log(`OTP generated for ${phone}: ${code} (dev mode — not sent via SMS)`);

    return { message: `OTP sent to ${phone}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.` };
  }

  /**
   * Verifies the OTP and returns JWT access + refresh tokens.
   * Marks the OTP as used and the farmer as verified.
   */
  async verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    const otp = await this.prismaService.otp.findFirst({
      where: { phone, code, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP. Please request a new one.');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Mark OTP as used
    await this.prismaService.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Mark farmer as verified
    const farmer = await this.prismaService.farmer.update({
      where: { phone },
      data: { isVerified: true },
    });

    const tokens = await this.generateTokens(farmer.id, farmer.phone);

    return {
      ...tokens,
      farmer: {
        id: farmer.id,
        phone: farmer.phone,
        name: farmer.name,
        preferredLanguage: farmer.preferredLanguage,
        isVerified: farmer.isVerified,
      },
    };
  }

  /**
   * Issues new access and refresh tokens using a valid refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const stored = await this.prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { farmer: { select: { id: true, phone: true, isActive: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.farmer.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const payload: JwtPayload = { sub: stored.farmer.id, phone: stored.farmer.phone };
    const accessToken = this.jwtService.sign(payload);

    // Rotate refresh token on every use (prevents token replay attacks)
    const newRefreshValue = `rt_${Buffer.from(randomInt(0, 2 ** 48 - 1).toString()).toString('base64url')}_${Date.now()}`;
    const newRefreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prismaService.refreshToken.update({
      where: { id: stored.id },
      data: { token: newRefreshValue, expiresAt: newRefreshExpiresAt },
    });

    return { accessToken, refreshToken: newRefreshValue };
  }

  /**
   * Invalidates the refresh token, logging the farmer out.
   */
  async logout(farmerId: string): Promise<{ message: string }> {
    await this.prismaService.refreshToken.deleteMany({ where: { farmerId } });
    return { message: 'Logged out successfully' };
  }

  /** Generates a JWT access token and a stored refresh token */
  private async generateTokens(
    farmerId: string,
    phone: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: farmerId, phone };

    const accessToken = this.jwtService.sign(payload);

    // Generate an opaque refresh token
    const refreshTokenValue = `rt_${Buffer.from(randomInt(0, 2 ** 48 - 1).toString()).toString('base64url')}_${Date.now()}`;
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prismaService.refreshToken.create({
      data: {
        farmerId,
        token: refreshTokenValue,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
