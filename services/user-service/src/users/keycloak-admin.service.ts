import { ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as process from 'node:process';

/**
 * Updates accounts in Keycloak through its admin REST API, using this service's own
 * service account (client "user-service-admin", role realm-management/manage-users).
 * The user's identity (name, e-mail) lives in Keycloak; this service only mirrors it.
 */
@Injectable()
export class KeycloakAdminService {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private token?: string;
    private expiresAt = 0;

    // KEYCLOAK_URL is the realm URL, e.g. http://keycloak:8080/realms/hotel
    private get realmUrl() { return process.env.KEYCLOAK_URL!; }
    private get adminUrl() { return this.realmUrl.replace('/realms/', '/admin/realms/'); }

    private async adminToken(): Promise<string> {
        if (this.token && Date.now() < this.expiresAt - 30_000) return this.token;
        const res = await axios.post(`${this.realmUrl}/protocol/openid-connect/token`, new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID ?? 'user-service-admin',
            client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET ?? '',
        }));
        this.token = res.data.access_token;
        this.expiresAt = Date.now() + res.data.expires_in * 1000;
        return this.token!;
    }

    /**
     * Changes the user's name and/or e-mail. A new e-mail is marked unverified and a
     * verification link is sent, so a hijacked session cannot silently take over the account.
     * Returns true when a verification e-mail was sent.
     */
    async updateAccount(userId: string, current: { email?: string }, changes: { firstName: string; lastName: string; email: string }): Promise<boolean> {
        const headers = { Authorization: `Bearer ${await this.adminToken()}` };
        const emailChanged = changes.email.toLowerCase() !== (current.email ?? '').toLowerCase();
        try {
            await axios.put(`${this.adminUrl}/users/${userId}`, {
                firstName: changes.firstName,
                lastName: changes.lastName,
                email: changes.email,
                ...(emailChanged ? { emailVerified: false } : {}),
            }, { headers });
        } catch (e) {
            const status = (e as AxiosError).response?.status;
            if (status === 409) throw new ConflictException('Cette adresse e-mail est déjà utilisée par un autre compte.');
            this.logger.error(`Keycloak user update failed (${status}): ${(e as AxiosError).message}`);
            throw new ServiceUnavailableException('Le compte n\'a pas pu être mis à jour. Réessayez dans un instant.');
        }

        if (!emailChanged) return false;
        try {
            await axios.put(`${this.adminUrl}/users/${userId}/execute-actions-email`, ['VERIFY_EMAIL'], {
                headers,
                params: { client_id: 'user-service', redirect_uri: process.env.APP_URL ?? 'http://localhost:5173/dashboard/profil' },
            });
            return true;
        } catch (e) {
            // The account is updated; only the e-mail failed (e.g. SMTP down). Keycloak will ask again at next login.
            this.logger.warn(`Verification e-mail not sent: ${(e as AxiosError).message}`);
            return false;
        }
    }
}
