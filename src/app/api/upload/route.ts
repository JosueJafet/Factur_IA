import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No se recibió archivo." }, { status: 400 });

    const ext = file.name.split(".").pop();
    const fileName = `${session.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("facturas")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[UPLOAD ERROR]", error);
      return NextResponse.json({ error: "Error al subir archivo." }, { status: 500 });
    }

    const { data } = supabase.storage.from("facturas").getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("[UPLOAD]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}