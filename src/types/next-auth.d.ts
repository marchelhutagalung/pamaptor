import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "USER" | "ADMIN";
      selfieUrl?: string;
    };
  }

  interface User {
    role: string;
    selfieUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    selfieUrl?: string;
    lastFetched?: number; // timestamp — used to throttle DB re-fetches to every 5 min
  }
}
