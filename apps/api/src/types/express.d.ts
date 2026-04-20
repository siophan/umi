import type { AdminProfile, UserSummary } from '@umi/shared';

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminProfile | null;
      user?: UserSummary | null;
    }
  }
}

export {};
