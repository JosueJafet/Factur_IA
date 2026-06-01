import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency", currency: "HNL", minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + "18" }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#1B2B4B] leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = parseInt(session.user.id);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totalFacturas, facturasDelMes, ultimasFacturas, montoMes] = await Promise.all([
    prisma.factura.count({ where: { id_usuario: userId } }),
    prisma.factura.count({ where: { id_usuario: userId, fecha: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.factura.findMany({
      where: { id_usuario: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { categoriaGasto: true },
    }),
    prisma.factura.aggregate({
      where: { id_usuario: userId, fecha: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true },
    }),
  ]);

  const montoTotal = Number(montoMes._sum.monto ?? 0);
  const mesNombre = now.toLocaleString("es-HN", { month: "long" });

  const iconFactura = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
  const iconCalendar = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
  const iconMoney = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B] tracking-tight">
          Buenos días, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Resumen de <span className="capitalize font-medium text-[#1B2B4B]/60">{mesNombre}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total facturas" value={String(totalFacturas)} sub="Todas las registradas" accent="#1B2B4B" icon={iconFactura} />
        <StatCard label={`Facturas de ${mesNombre}`} value={String(facturasDelMes)} sub="Este mes" accent="#00AEEF" icon={iconCalendar} />
        <StatCard label={`Monto de ${mesNombre}`} value={formatCurrency(montoTotal)} sub="Total gastado este mes" accent="#F47920" icon={iconMoney} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1B2B4B]">Últimas facturas</h2>
          <a href="/dashboard/facturas" className="text-xs text-[#00AEEF] hover:underline font-medium">Ver todas →</a>
        </div>

        {ultimasFacturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F9FC] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Sin facturas aún</p>
            <p className="text-xs text-gray-300 mt-1">Registra tu primera factura para verla aquí</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ultimasFacturas.map((f) => (
              <div key={f.id_factura} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#F7F9FC] flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#00AEEF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B2B4B] truncate">{f.proveedor}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.categoriaGasto?.nombre ?? "Sin categoría"} · {formatDate(f.fecha)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${f.ingreso_gasto === "Gasto" ? "text-red-500" : "text-green-500"}`}>
                    {f.ingreso_gasto === "Gasto" ? "-" : "+"}{formatCurrency(Number(f.monto))}
                  </p>
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${f.ingreso_gasto === "Gasto" ? "bg-red-50 text-red-400" : "bg-green-50 text-green-500"}`}>
                    {f.ingreso_gasto}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
