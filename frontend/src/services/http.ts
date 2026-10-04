import axios, { type AxiosInstance } from 'axios';
import keycloak from '../config/keycloak';

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Attaches a fresh access token to every request. Tokens only live 5 minutes, so the
 * token is refreshed first when it expires within 30 s; a stale token would make the
 * gateway answer 401 even on public endpoints such as room availability.
 * Anonymous visitors send no token at all.
 */
export function withAuth(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use(async config => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
      } catch {
        // Session is over (refresh token expired): go back through the login page
        keycloak.login();
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  });
  return instance;
}

/** Shared client for all backend calls through the gateway. */
export const http = withAuth(axios.create());
