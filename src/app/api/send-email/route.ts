import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = parseInt(session.user.id);

  try {
    const { destinatario, mes, facturaIds } = await req.json();

    if (!destinatario || !mes || !facturaIds?.length) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    // Obtener facturas seleccionadas
    const facturas = await prisma.factura.findMany({
      where: { id_factura: { in: facturaIds }, id_usuario: userId },
      include: { categoriaGasto: true, tipoDocumento: true },
      orderBy: { fecha: "asc" },
    });

    const totalGastos = facturas
      .filter((f) => f.ingreso_gasto === "Gasto")
      .reduce((s, f) => s + Number(f.monto), 0);

    const totalIngresos = facturas
      .filter((f) => f.ingreso_gasto === "Ingreso")
      .reduce((s, f) => s + Number(f.monto), 0);

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);

    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric" }).format(d);

    const filasHTML = facturas
      .map(
        (f) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${formatDate(f.fecha)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${f.proveedor}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${f.categoriaGasto?.nombre ?? "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${f.tipoDocumento?.nombre ?? "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:${f.ingreso_gasto === "Gasto" ? "#ef4444" : "#22c55e"};">
            ${f.ingreso_gasto === "Gasto" ? "-" : "+"}${formatCurrency(Number(f.monto))}
          </td>
        </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f9fc;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:#1B2B4B;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">FacturIA</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Organización Inteligente de Gastos</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 6px;color:#1B2B4B;font-size:18px;">Reporte mensual — ${mes}</h2>
      <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
        Enviado por ${session.user.name ?? session.user.email}
      </p>

      <!-- Resumen -->
      <div style="display:flex;gap:16px;margin-bottom:28px;">
        <div style="flex:1;background:#f7f9fc;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Total facturas</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#1B2B4B;">${facturas.length}</p>
        </div>
        <div style="flex:1;background:#fef2f2;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Total gastos</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#ef4444;">${formatCurrency(totalGastos)}</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Total ingresos</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#22c55e;">${formatCurrency(totalIngresos)}</p>
        </div>
      </div>

      <!-- Tabla -->
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f7f9fc;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Fecha</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Proveedor</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Categoría</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Tipo</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Monto</th>
          </tr>
        </thead>
        <tbody>${filasHTML}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
        Generado con FacturIA · ${new Date().toLocaleDateString("es-HN")}
      </p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "FacturIA <onboarding@resend.dev>",
      to: destinatario,
      subject: `Reporte de facturas — ${mes}`,
      html,
    });

    if (error) {
      console.error("[RESEND ERROR]", error);
      return NextResponse.json({ error: "Error al enviar correo." }, { status: 500 });
    }

    // Registrar envío en BD
    await prisma.detalleEnvio.create({
      data: {
        destinatario,
        medio_envio: "correo",
        estado: "Enviado",
        facturas_enviadas: facturas.length,
        facturas: {
          create: facturaIds.map((id: number) => ({ id_factura: id })),
        },
      },
    });

    return NextResponse.json({ message: "Correo enviado correctamente." });
  } catch (error) {
    console.error("[SEND EMAIL]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}