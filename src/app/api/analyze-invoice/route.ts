export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "Se requiere imageUrl." }, { status: 400 });

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return NextResponse.json({ error: "No se pudo obtener la imagen." }, { status: 400 });

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = (imgRes.headers.get("content-type") ?? "image/jpeg") as string;

    // Inicializar dentro de la función
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analiza esta imagen de factura o recibo y extrae la siguiente información.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.

El JSON debe tener exactamente esta estructura:
{
  "proveedor": "nombre del negocio o empresa emisora",
  "fecha": "fecha en formato YYYY-MM-DD",
  "monto": número con decimales sin símbolo de moneda,
  "categoria_sugerida": una de estas opciones exactas: "Alimentación" | "Transporte" | "Combustible" | "Servicios" | "Compras de oficina" | "Salud" | "Educación" | "Otros",
  "tipo_documento": "FACTURA" | "RECIBO" | "OTROS",
  "confianza": número del 0 al 100
}

Si no puedes identificar algún campo usa null.
Si la imagen no es una factura responde: {"error": "No es una factura válida"}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      prompt,
    ]);

    const text = result.response.text();

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: "No se pudo parsear la respuesta." }, { status: 500 });
    }
  } catch (error) {
    console.error("[GEMINI SDK ERROR]", error);
    return NextResponse.json({ error: "Error al analizar con IA." }, { status: 500 });
  }
}