import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";

export async function AuthRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If user is logged in, redirect to /app immediately (server-side)
  if (session?.user) {
    redirect("/app");
  }

  return <>{children}</>;
}
