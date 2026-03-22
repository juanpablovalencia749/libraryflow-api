import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await this.passwordService.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.getTokens(user.id, user.email, user.role);
  }

  async getTokens(userId: number, email: string, role: string) {
    const payload = { email, sub: userId, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: 'refresh-secret', // Should be from config in real app
        expiresIn: '7d',
      }),
    ]);
      console.log('Generated Access Token:', accessToken);
      console.log('Generated Refresh Token:', refreshToken);
    const refreshTokenHash = await this.passwordService.hash(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.usersService.updateRefreshToken(userId, refreshTokenHash, expiresAt);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findOneById(userId) as any;
    if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Access Denied');
    }

    if (new Date() > user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh Token Expired');
    }

    const refreshTokenMatches = await this.passwordService.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.getTokens(user.id, user.email, user.role);
  }

  async register(registerDto: RegisterDto) {
    const passwordHash = await this.passwordService.hash(registerDto.password);
    
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
