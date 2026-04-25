import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { UserAccount } from '../staff/staff.entity';

interface JwtPayload {
  sub?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = authHeader.slice(7);
    const secret =
      process.env.JWT_SECRET ||
      'TXlTdXBlclNlY3JldEtleUZvckpXVFNpZ25pbmdBbmRUb2tlbkdlbmVyYXRpb24xMjM0NTY=';

    let payload: JwtPayload;
    try {
      payload = verify(token, Buffer.from(secret, 'base64')) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const username = payload.sub;
    if (!username) {
      throw new UnauthorizedException('Token is missing subject claim.');
    }

    const user = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.username', 'u.role'])
      .where('u.username = :username', { username })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Authenticated user not found.');
    }

    request.user = {
      username: user.username,
      role: (user.role as unknown as string).toUpperCase(),
    };

    return true;
  }
}

