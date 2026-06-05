import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const tipos = await prisma.tipoDocumento.findMany();
  return NextResponse.json(tipos);
}