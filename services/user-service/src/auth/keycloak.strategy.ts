import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import axios from 'axios';
import * as process from "node:process";

/** What the guard puts on req.user. */
export interface AuthUser {
    sub: string;
    email?: string;
    email_verified?: boolean;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    roles: string[];
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'bearer') {
    private readonly logger = new Logger(KeycloakStrategy.name);

    async validate(token: string): Promise<AuthUser | null> {
        const userInfoUrl = `${process.env.KEYCLOAK_URL}/protocol/openid-connect/userinfo`;

        try {
            // Keycloak accepting the token at /userinfo is what proves it is valid
            const response = await axios.get(userInfoUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Realm roles are only in the access token, which Keycloak has just validated
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
            return { ...response.data, roles: payload.realm_access?.roles ?? [] };
        } catch (err) {
            this.logger.warn(`Keycloak token validation failed: ${err.message}`);
            return null;
        }
    }
}
