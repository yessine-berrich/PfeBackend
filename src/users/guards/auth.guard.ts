import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { JwtPayloadType } from "utils/types";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const [type, token]= request.headers.authorization?.split(" ") ?? [];
        if (type !== "Bearer" || !token) {
            throw new UnauthorizedException("Authorization header is missing or malformed");
        }
        try {
            const secret = this.configService.get<string>("JWT_SECRET");
            const payload: JwtPayloadType = await this.jwtService.verifyAsync(token, { secret });
            request.user = payload; // Attach user info to the request
            return true;
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired token");
        }

    }
}