export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { nombre, correo, contrasena } = await req.json();

    if (!nombre || !correo || !contrasena) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }

    if (contrasena.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { correo } });

    if (existente) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
    }

    const hash = await bcrypt.hash(contrasena, 12);

    const usuario = await prisma.usuario.create({
      data: { nombre, correo, contrasena: hash, estado: "Activo" },
    });

    return NextResponse.json({ message: "Usuario creado correctamente.", id: usuario.id_usuario }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}