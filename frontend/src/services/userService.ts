import { http, API_BASE } from './http';

const API = `${API_BASE}/api/users`;

export type Account = { firstName: string; lastName: string; email: string };

export const userService = {
  /** Updates the logged-in user's name and e-mail (in Keycloak, through user-service). */
  updateMe: (account: Account) =>
    http.patch<Account & { verificationSent: boolean }>(`${API}/me`, account),
};
