import type { Role } from "@easypos/types";

export type Env = {
  Variables: {
    userId: string;
    orgId: string;
    role: Role;
    branchId: string | null;
  };
};
