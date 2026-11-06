import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      emailConfirmed: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    emailConfirmed?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    role?: Role;
    emailConfirmed?: boolean;
    sessionVersion?: number;
  }
}
