"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Categoria { id_categoria_gasto: number; nombre: string; }
interface TipoDoc { id_tipo_documento: number; nombre: string; }

interface FacturaData {
  id_factura?: number;
  fecha: string;
  proveedor: string;
  monto: string;
  id_tipo_gasto: string;
  id_tipo_documento: string;
  ingreso_gasto: "Ingreso" | "Gasto";
  factura_fisica: boolean;
  imagen?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  inicial?: FacturaData | null;
  categorias: Categoria[];
  tiposDoc: TipoDoc[];
}

const empty: FacturaData = {
  fecha: new Date().toISOString().split("T")[0],
  proveedor: "",
  monto: "",
  id_tipo_gasto: "",
  id_tipo_documento: "",
  ingreso_gasto: "Gasto",
  factura_fisica: false,
  imagen: null,
};

export default function FacturaModal({ open, onClose, onSaved, inicial, categorias, tiposDoc }: Props) {
  const [form, setForm] = useState<FacturaData>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!inicial?.id_factura;

  useEffect(() => {
    if (open) {
      setForm(inicial ?? empty);
      setPreview(inicial?.imagen ?? null);
      setError("");
    }
  }, [open, inicial]);

  if (!open) return null;

  const set = (k: keyof FacturaData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Upload archivo ──
  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error); return; }
    set("imagen", data.url);
    setPreview(data.url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/api/facturas/${form.id_factura}` : "/api/facturas";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
    onSaved();
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[#1B2B4B] text-sm focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15 transition-all";
  const labelCls = "block text-xs font-semibold text-[#1B2B4B]/60 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-[#1B2B4B]">
              {isEdit ? "Editar factura" : "Nueva factura"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Modifica los datos de la factura" : "Completa los datos para registrar"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1B2B4B] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Upload zone */}
          <div>
            <label className={labelCls}>Imagen / PDF de factura</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${preview ? "border-[#00AEEF]/40 bg-[#00AEEF]/5" : "border-gray-200 hover:border-[#00AEEF]/50 hover:bg-gray-50"}
              `}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {uploading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <svg className="animate-spin w-6 h-6 text-[#00AEEF]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-gray-400">Subiendo archivo...</p>
                </div>
              ) : preview ? (
                <div className="relative">
                  {preview.endsWith(".pdf") ? (
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#1B2B4B] font-medium">PDF subido correctamente</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); set("imagen", null); setPreview(null); }}
                        className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-40 rounded-xl overflow-hidden">
                      <Image src={preview} alt="preview" fill className="object-contain p-2" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); set("imagen", null); setPreview(null); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">Arrastra aquí o <span className="text-[#00AEEF] font-medium">haz clic para subir</span></p>
                  <p className="text-xs text-gray-300">PNG, JPG, PDF hasta 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Fila: proveedor */}
          <div>
            <label className={labelCls}>Proveedor *</label>
            <input type="text" required value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)}
              placeholder="Nombre del proveedor" className={inputCls} />
          </div>

          {/* Fila: fecha + monto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha *</label>
              <input type="date" required value={form.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Monto *</label>
              <input type="number" required step="0.01" min="0" value={form.monto}
                onChange={(e) => set("monto", e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
          </div>

          {/* Fila: categoria + tipo doc */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Categoría *</label>
              <select required value={form.id_tipo_gasto} onChange={(e) => set("id_tipo_gasto", e.target.value)} className={inputCls}>
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria_gasto} value={c.id_categoria_gasto}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de documento *</label>
              <select required value={form.id_tipo_documento} onChange={(e) => set("id_tipo_documento", e.target.value)} className={inputCls}>
                <option value="">Seleccionar...</option>
                {tiposDoc.map((t) => (
                  <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila: ingreso/gasto + fisica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo *</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["Gasto", "Ingreso"] as const).map((tipo) => (
                  <button key={tipo} type="button"
                    onClick={() => set("ingreso_gasto", tipo)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                      form.ingreso_gasto === tipo
                        ? tipo === "Gasto" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                        : "bg-white text-gray-400 hover:bg-gray-50"
                    }`}>
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer group pb-0.5">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${form.factura_fisica ? "bg-[#00AEEF]" : "bg-gray-200"}`}
                  onClick={() => set("factura_fisica", !form.factura_fisica)}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.factura_fisica ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-sm text-[#1B2B4B]/70 font-medium">Factura física</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving || uploading}
              className="flex-1 py-2.5 rounded-xl bg-[#1B2B4B] text-white text-sm font-semibold hover:bg-[#243660] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Guardando...</>
              ) : isEdit ? "Guardar cambios" : "Registrar factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
