import type { UserRole } from '../middlewares/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      branchId?: string;
      auth?: {
        userId: string;
        role: UserRole;
        branchId: string | null;
      };
    }
  }
}
