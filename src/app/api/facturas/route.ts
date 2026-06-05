import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

// GET /api/facturas?mes=2025-05&categoria=1
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");         // formato: "2025-05"
  const categoria = searchParams.get("categoria");

  const where: Record<string, unknown> = { id_usuario: userId };

  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    where.fecha = {
      gte: new Date(year, month - 1, 1),
      lte: new Date(year, month, 0, 23, 59, 59),
    };
  }

  if (categoria) {
    where.id_tipo_gasto = parseInt(categoria);
  }

  const facturas = await prisma.factura.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: { categoriaGasto: true, tipoDocumento: true },
  });

  return NextResponse.json(facturas);
}

// POST /api/facturas
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = parseInt(session.user.id);

  try {
    const body = await req.json();
    const {
      fecha, proveedor, monto, id_tipo_gasto,
      id_tipo_documento, ingreso_gasto, imagen, factura_fisica,
    } = body;

    if (!fecha || !proveedor || !monto || !id_tipo_gasto || !id_tipo_documento || !ingreso_gasto) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const factura = await prisma.factura.create({
      data: {
        fecha: new Date(fecha),
        proveedor,
        monto: parseFloat(monto),
        id_tipo_gasto: parseInt(id_tipo_gasto),
        id_tipo_documento: parseInt(id_tipo_documento),
        ingreso_gasto,
        imagen: imagen ?? null,
        factura_fisica: factura_fisica ?? false,
        id_usuario: userId,
      },
      include: { categoriaGasto: true, tipoDocumento: true },
    });

    return NextResponse.json(factura, { status: 201 });
  } catch (error) {
    console.error("[POST /api/facturas]", error);
    return NextResponse.json({ error: "Error al crear factura." }, { status: 500 });
  }
}