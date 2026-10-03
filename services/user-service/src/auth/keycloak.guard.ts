import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class KeycloakGuard extends AuthGuard('bearer') {
    handleRequest(err, user) {
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired token');
        }
        return user;
    }
}
