import type { UserRole } from "@abuja-messenger/contracts";
import type { UserHydrated } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: UserHydrated;
      platformIdentity?: { openId: string; name?: string; email?: string };
      log: {
        error: (payload: unknown, message: string) => void;
      };
    }
  }
}

export type AuthenticatedRole = UserRole;