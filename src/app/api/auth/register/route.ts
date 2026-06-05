import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { nombre, correo, contrasena } = await req.json();

    // Validaciones básicas
    if (!nombre || !correo || !contrasena) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    if (contrasena.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Verificar si el correo ya existe
    const existente = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo." },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(contrasena, 12);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        contrasena: hash,
        estado: "Activo",
      },
    });

    return NextResponse.json(
      { message: "Usuario creado correctamente.", id: usuario.id_usuario },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}