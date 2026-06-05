export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const factura = await prisma.factura.findFirst({
    where: { id_factura: parseInt(id), id_usuario: parseInt(session.user.id) },
    include: { categoriaGasto: true, tipoDocumento: true },
  });

  if (!factura) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(factura);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { fecha, proveedor, monto, id_tipo_gasto, id_tipo_documento, ingreso_gasto, imagen, factura_fisica } = body;

    const factura = await prisma.factura.updateMany({
      where: { id_factura: parseInt(id), id_usuario: parseInt(session.user.id) },
      data: {
        fecha: new Date(fecha), proveedor, monto: parseFloat(monto),
        id_tipo_gasto: parseInt(id_tipo_gasto), id_tipo_documento: parseInt(id_tipo_documento),
        ingreso_gasto, imagen: imagen ?? null, factura_fisica: factura_fisica ?? false,
      },
    });

    if (factura.count === 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ message: "Actualizada correctamente." });
  } catch (error) {
    console.error("[PUT]", error);
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const deleted = await prisma.factura.deleteMany({
      where: { id_factura: parseInt(id), id_usuario: parseInt(session.user.id) },
    });

    if (deleted.count === 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ message: "Eliminada correctamente." });
  } catch (error) {
    console.error("[DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 });
  }
} 