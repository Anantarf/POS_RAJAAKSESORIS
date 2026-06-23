export const ROLES = {
  OWNER: "pemilik",
  CASHIER: "kasir",
};

export const ROLE_GROUPS = {
  AUTHENTICATED: [ROLES.OWNER, ROLES.CASHIER],
  OWNER_ONLY: [ROLES.OWNER],
};

export const ROUTE_ACCESS = {
  POS: ROLE_GROUPS.AUTHENTICATED,
  INVENTORY: ROLE_GROUPS.AUTHENTICATED,
  HISTORY: ROLE_GROUPS.AUTHENTICATED,
  ADMIN: ROLE_GROUPS.OWNER_ONLY,
};

export function canAccessRole(role, allowedRoles = []) {
  return allowedRoles.includes(role);
}
