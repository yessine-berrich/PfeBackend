import { UsersService } from '../users.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from 'utils/types';
import { Reflector } from '@nestjs/core';
import { userRole } from 'utils/constants';
import { ROLES_KEY } from '../decorators/user-role.decorator';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  // ... imports et constructeur inchangés ...

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: userRole[] = this.reflector.getAllAndOverride<userRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // --- 1. AUTHENTIFICATION (Obligatoire pour toutes les routes du contrôleur) ---
    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization header is missing or malformed',
      );
    }

    let payload: JwtPayloadType;
    let user: User | null; // Type simplifié pour l'utilisateur

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      payload = await this.jwtService.verifyAsync(token, { secret });

      // Récupérer l'utilisateur pour son rôle
      user = await this.usersService.getCurrentUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Toujours insérer le payload après vérification
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token'); // Token invalide (401)
    }

    // --- 2. AUTORISATION (Vérification des Rôles) ---

    // Si la route n'a AUCUN rôle spécifié, on autorise l'accès (mais l'utilisateur est authentifié).
    if (!roles || roles.length === 0) {
      // Cela permet aux routes comme GET /users/me de passer après l'authentification
      return true;
    }

    // Si des rôles sont spécifiés, on vérifie l'autorisation
    if (roles.includes(user.role)) {
      return true;
    }

    // Si l'utilisateur est authentifié mais n'a pas le bon rôle
    throw new ForbiddenException(
      `Rôle non autorisé. Votre rôle ('${user.role}') n'est pas autorisé pour cette ressource. Rôles requis: ${roles.join(', ')}.`,
    );
  }
}