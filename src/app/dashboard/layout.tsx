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
    <div className="min-h-screen bg-[#F7F9FC] flex">
      {/* Sidebar — fijo en desktop, drawer en móvil (controlado por Topbar) */}
      <Sidebar user={session.user ?? {}} /> 

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Topbar user={session.user ?? {}} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
