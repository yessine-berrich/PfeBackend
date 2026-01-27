import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadType } from 'utils/types';

/**
 * Décorateur pour injecter directement le payload JWT (ID et rôle de l'utilisateur)
 * attaché à l'objet de la requête par AuthRolesGuard.
 */
export const CurrentPayload = createParamDecorator(
  // 🚨 Changement de nom
  (data: unknown, context: ExecutionContext): JwtPayloadType => {
    const request = context.switchToHttp().getRequest();
    // Le AuthRolesGuard attache le payload au champ request.user
    const payload: JwtPayloadType = request.user;
    return payload;
  },
);
