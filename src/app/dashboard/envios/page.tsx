"use client";

import { useCallback, useEffect, useState } from "react";

interface Factura {
  id_factura: number;
  fecha: string;
  proveedor: string;
  monto: number;
  ingreso_gasto: "Ingreso" | "Gasto";
  imagen?: string | null;
  categoriaGasto?: { nombre: string } | null;
  tipoDocumento?: { nombre: string } | null;
}

interface Envio {
  id_detalle_envio: number;
  timestamp: string;
  destinatario: string;
  medio_envio: string;
  estado: string;
  facturas_enviadas: number;
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export default function EnviosPage() {
  const now = new Date();
  const [mesFilter, setMesFilter] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinatario, setDestinatario] = useState("");
  const [whatsappNum, setWhatsappNum] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"facturas" | "historial">("facturas");

  const [year, month] = mesFilter.split("-");
  const mesLabel = `${MESES[parseInt(month)-1]} ${year}`;

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/facturas?mes=${mesFilter}`);
    const data = await res.json();
    setFacturas(Array.isArray(data) ? data : []);
    setSelected(new Set());
    setLoading(false);
  }, [mesFilter]);

  const fetchEnvios = useCallback(async () => {
    const res = await fetch("/api/envios");
    const data = await res.json();
    setEnvios(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchFacturas(); fetchEnvios(); }, [fetchFacturas, fetchEnvios]);

  const toggleAll = () => {
    if (selected.size === facturas.length) setSelected(new Set());
    else setSelected(new Set(facturas.map((f) => f.id_factura)));
  };

  const toggle = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectedFacturas = facturas.filter((f) => selected.has(f.id_factura));
  const totalGastos = selectedFacturas.filter((f) => f.ingreso_gasto === "Gasto").reduce((s, f) => s + f.monto, 0);
  const totalIngresos = selectedFacturas.filter((f) => f.ingreso_gasto === "Ingreso").reduce((s, f) => s + f.monto, 0);

  // ── Generar PDF ──
  const handleDownloadPDF = async () => {
    if (!selected.size) return;
    setGeneratingPDF(true);

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();

    // Header
    doc.setFillColor(27, 43, 75);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FacturIA", 14, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Organización Inteligente de Gastos", 14, 24);
    doc.text(`Reporte mensual — ${mesLabel}`, 14, 31);

    // Resumen
    doc.setTextColor(27, 43, 75);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen del período", 14, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total facturas: ${selectedFacturas.length}`, 14, 56);
    doc.text(`Total gastos: ${formatCurrency(totalGastos)}`, 80, 56);
    doc.text(`Total ingresos: ${formatCurrency(totalIngresos)}`, 146, 56);

    // Tabla
    autoTable(doc, {
      startY: 65,
      head: [["Fecha", "Proveedor", "Categoría", "Tipo", "Monto"]],
      body: selectedFacturas.map((f) => [
        formatDate(f.fecha),
        f.proveedor,
        f.categoriaGasto?.nombre ?? "—",
        f.tipoDocumento?.nombre ?? "—",
        `${f.ingreso_gasto === "Gasto" ? "-" : "+"}${formatCurrency(f.monto)}`,
      ]),
      headStyles: { fillColor: [27, 43, 75], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
      styles: { cellPadding: 4 },
    });

    // Footer
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generado con FacturIA · ${new Date().toLocaleDateString("es-HN")} · Página ${i} de ${pageCount}`, 14, 290);
    }

    doc.save(`reporte-${mesFilter}.pdf`);
    setGeneratingPDF(false);
  };

  // ── Enviar por correo ──
  const handleSendEmail = async () => {
    if (!selected.size || !destinatario) return;
    setSending(true);
    setMsg(null);

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinatario,
        mes: mesLabel,
        facturaIds: Array.from(selected),
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setMsg({ type: "err", text: data.error ?? "Error al enviar." });
    } else {
      setMsg({ type: "ok", text: "Correo enviado correctamente." });
      setDestinatario("");
      fetchEnvios();
    }
  };

  // ── WhatsApp ──
  const handleWhatsApp = () => {
    if (!selected.size) return;
    const texto = encodeURIComponent(
      `Hola, te comparto el resumen de facturas de ${mesLabel}:\n\n` +
      `📄 Total facturas: ${selectedFacturas.length}\n` +
      `💸 Gastos: ${formatCurrency(totalGastos)}\n` +
      `💰 Ingresos: ${formatCurrency(totalIngresos)}\n\n` +
      selectedFacturas.map((f) => `• ${f.proveedor} — ${formatCurrency(f.monto)} (${formatDate(f.fecha)})`).join("\n")
    );
    const url = whatsappNum
      ? `https://wa.me/${whatsappNum.replace(/\D/g, "")}?text=${texto}`
      : `https://wa.me/?text=${texto}`;
    window.open(url, "_blank");
  };

  // ── Copiar enlace (resumen texto) ──
  const handleCopyLink = async () => {
    if (!selected.size) return;
    const texto =
      `Reporte FacturIA — ${mesLabel}\n` +
      `Facturas: ${selectedFacturas.length} | Gastos: ${formatCurrency(totalGastos)} | Ingresos: ${formatCurrency(totalIngresos)}\n\n` +
      selectedFacturas.map((f) => `${formatDate(f.fecha)} · ${f.proveedor} · ${formatCurrency(f.monto)}`).join("\n");
    await navigator.clipboard.writeText(texto);
    setMsg({ type: "ok", text: "Resumen copiado al portapapeles." });
    setTimeout(() => setMsg(null), 3000);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[#1B2B4B] text-sm focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15 transition-all";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      {/* Hero */}
<div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#030712] p-8">
  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[140px]" />

  <div className="relative z-10">
    <p className="text-cyan-400 text-sm font-medium">
      Reportes y distribución
    </p>

    <h1 className="text-4xl font-black text-white mt-2 tracking-tight">
      Centro de envíos
    </h1>

    <p className="text-white/50 mt-3 max-w-2xl">
      Genera reportes PDF, comparte facturas por correo o WhatsApp y mantén un historial de envíos.
    </p>
  </div>
</div>

      {/* Tabs */}
      <div className="flex bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 w-fit">
        {(["facturas", "historial"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20" : "text-gray-400 hover:text-[#1B2B4B]"}`}>
            {t === "facturas" ? "Seleccionar facturas" : "Historial de envíos"}
          </button>
        ))}
      </div>

      {tab === "facturas" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista facturas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtro mes */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] px-5 py-4 flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2B4B]/60 uppercase tracking-wider mb-1.5">Mes</label>
                <input type="month" value={mesFilter} onChange={(e) => setMesFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#1B2B4B] focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15 transition-all" />
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-400 font-medium">{selected.size} de {facturas.length} seleccionadas</p>
                <button onClick={toggleAll} className="text-xs text-[#00AEEF] hover:underline font-medium mt-0.5">
                  {selected.size === facturas.length && facturas.length > 0 ? "Deseleccionar todo" : "Seleccionar todo"}
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="animate-spin w-6 h-6 text-[#00AEEF]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : facturas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <p className="text-sm font-medium text-gray-400">No hay facturas en este período</p>
                  <p className="text-xs text-gray-300 mt-1">Cambia el mes o registra nuevas facturas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {facturas.map((f) => (
                    <div key={f.id_factura} onClick={() => toggle(f.id_factura)}
                      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${selected.has(f.id_factura) ? "bg-cyan-500/10 border-l-4 border-cyan-400" : "hover:bg-gray-50/60"}`}>
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(f.id_factura) ? "bg-[#00AEEF] border-[#00AEEF]" : "border-gray-300"}`}>
                        {selected.has(f.id_factura) && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1B2B4B] truncate">{f.proveedor}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{f.categoriaGasto?.nombre ?? "—"} · {formatDate(f.fecha)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${f.ingreso_gasto === "Gasto" ? "text-red-500" : "text-green-500"}`}>
                          {f.ingreso_gasto === "Gasto" ? "-" : "+"}{formatCurrency(f.monto)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel de acciones */}
          <div className="space-y-4">
            {/* Resumen selección */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B4B]">Resumen selección</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Facturas</span>
                  <span className="font-semibold text-[#1B2B4B]">{selected.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gastos</span>
                  <span className="font-bold text-red-500">{formatCurrency(totalGastos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ingresos</span>
                  <span className="font-bold text-green-500">{formatCurrency(totalIngresos)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Balance</span>
                  <span className={`font-bold ${totalIngresos - totalGastos >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(Math.abs(totalIngresos - totalGastos))}
                  </span>
                </div>
              </div>
            </div>

            {/* Descargar PDF */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B4B]">Descargar PDF</h3>
              <button onClick={handleDownloadPDF} disabled={!selected.size || generatingPDF}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:bg-[#243660] disabled:opacity-50 transition-all">
                {generatingPDF ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generando...</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Descargar PDF</>
                )}
              </button>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B4B]">WhatsApp</h3>
              <input type="tel" value={whatsappNum} onChange={(e) => setWhatsappNum(e.target.value)}
                placeholder="Número (opcional, ej: 50499...)" className={inputCls} />
              <button onClick={handleWhatsApp} disabled={!selected.size}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
              </button>
            </div>

            {/* Correo */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B4B]">Correo electrónico</h3>
              <input type="email" value={destinatario} onChange={(e) => setDestinatario(e.target.value)}
                placeholder="correo@contadora.com" className={inputCls} />
              <button onClick={handleSendEmail} disabled={!selected.size || !destinatario || sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:bg-[#0D9DA8] disabled:opacity-50 transition-all">
                {sending ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Enviando...</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>Enviar correo</>
                )}
              </button>

              {/* Copiar enlace */}
              <button onClick={handleCopyLink} disabled={!selected.size}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[#1B2B4B] text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                Copiar resumen
              </button>
            </div>

            {/* Mensaje feedback */}
            {msg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 border border-green-100 text-green-600" : "bg-red-50 border border-red-100 text-red-500"}`}>
                {msg.type === "ok" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                )}
                {msg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial */}
      {tab === "historial" && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] overflow-hidden">
          {envios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F9FC] flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-400">Sin envíos registrados</p>
              <p className="text-xs text-gray-300 mt-1">Los envíos por correo aparecerán aquí</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Fecha","Destinatario","Medio","Facturas","Estado"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {envios.map((e) => (
                  <tr key={e.id_detalle_envio} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Intl.DateTimeFormat("es-HN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(e.timestamp))}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#1B2B4B]">{e.destinatario}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[#00AEEF]/10 text-[#00AEEF] capitalize">{e.medio_envio}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{e.facturas_enviadas}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${e.estado === "Enviado" ? "bg-green-50 text-green-600" : e.estado === "Pendiente" ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-500"}`}>
                        {e.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
