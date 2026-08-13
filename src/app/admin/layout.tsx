import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");
  return children;
}
