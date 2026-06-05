// src/app/api/categorias/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const categorias = await prisma.categoriaGasto.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(categorias);
}