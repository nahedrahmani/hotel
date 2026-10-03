import keycloak from './keycloak';

// Mirrors the @PreAuthorize rules of the backend endpoints each page relies on.
export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];
export const MANAGEMENT_ROLES = ['ADMIN', 'MANAGER'];

/**
 * Roles allowed on each /dashboard page, keyed by sub-path. The longest matching
 * prefix wins (so "stock/test" overrides "stock"). Pages not listed are open to
 * any logged-in user (booking, own reservations, messages, listings).
 */
const PAGE_ROLES: Record<string, string[]> = {
  reservations: STAFF_ROLES,
  occupation: STAFF_ROLES,
  menage: STAFF_ROLES,
  chambres: STAFF_ROLES,
  calendar: STAFF_ROLES,
  clients: ['ADMIN', 'STAFF'],
  demandes: STAFF_ROLES,
  checkinout: STAFF_ROLES,
  'payment/factures': STAFF_ROLES,
  'payment/rapports': MANAGEMENT_ROLES,
  analytique: MANAGEMENT_ROLES,
  rh: STAFF_ROLES,
  tasks: STAFF_ROLES,
  stock: STAFF_ROLES,
  // Developer diagnostics, not part of the hotel workflow
  'stock/test': ['ADMIN'],
  'stock/test-integration': ['ADMIN'],
  'stock/diagnostic': ['ADMIN'],
};

export const userRoles = (): string[] => keycloak.tokenParsed?.realm_access?.roles ?? [];

export const hasAnyRole = (roles: string[]): boolean => userRoles().some(r => roles.includes(r));

export const isStaff = (): boolean => hasAnyRole(STAFF_ROLES);

/** Whether the current user may open a dashboard page ("/dashboard/rh/planning" or "rh/planning"). */
export const canOpen = (path: string): boolean => {
  const sub = path.replace(/^\/dashboard\/?/, '');
  const key = Object.keys(PAGE_ROLES)
    .filter(k => sub === k || sub.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0];
  if (!key) return true;
  const roles = userRoles();
  return PAGE_ROLES[key].some(r => roles.includes(r));
};
