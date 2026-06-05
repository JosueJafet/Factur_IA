import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex overflow-x-hidden">
      {/* Sidebar solo visible en desktop */}
      <div className="hidden lg:block">
        <Sidebar user={session.user ?? {}} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72 overflow-x-hidden">
        <Topbar user={session.user ?? {}} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}