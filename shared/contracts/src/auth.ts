export const USER_ROLES = [
  "customer",
  "business_customer",
  "rider",
  "administrator",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** What the API sends back to the browser. */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  displayName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
};

/** What the browser sends to POST /auth/login. */
export type LoginInput = {
  email: string;
  password: string;
};

/** What the browser sends to POST /auth/register. */
export type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
};