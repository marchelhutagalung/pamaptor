import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UploadClient from "./UploadClient";

// Server component: resolves isAdmin from the JWT session before rendering.
// This avoids the client-side useSession() timing issue where session is null
// on first render, making isAdmin briefly false even for admin users.
export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return <UploadClient isAdmin={isAdmin} />;
}
