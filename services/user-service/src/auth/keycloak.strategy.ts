import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import axios from 'axios';
import * as process from "node:process";

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'bearer') {
    private readonly logger = new Logger(KeycloakStrategy.name);

    async validate(token: string) {
        const userInfoUrl = `${process.env.KEYCLOAK_URL}/protocol/openid-connect/userinfo`;

        try {
            const response = await axios.get(userInfoUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (err) {
            this.logger.warn(`Keycloak token validation failed: ${err.message}`);
            return null;
        }
    }
}
