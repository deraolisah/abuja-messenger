export const USER_ROLES = [
  "customer",
  "rider",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** What the API sends back to the browser. */
export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
};
