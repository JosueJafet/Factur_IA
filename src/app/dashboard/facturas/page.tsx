"use client";

import { useCallback, useEffect, useState } from "react";
import FacturaModal from "@/components/dashboard/FacturaModal";
import Image from "next/image";

interface Categoria { id_categoria_gasto: number; nombre: string; }
interface TipoDoc { id_tipo_documento: number; nombre: string; }
interface Factura {
  id_factura: number;
  fecha: string;
  proveedor: string;
  monto: number;
  ingreso_gasto: "Ingreso" | "Gasto";
  factura_fisica: boolean;
  imagen?: string | null;
  categoriaGasto?: { nombre: string } | null;
  tipoDocumento?: { nombre: string } | null;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export default function FacturasPage() {
  const now = new Date();
  const [mesFilter, setMesFilter] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [catFilter, setCatFilter] = useState("");
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Factura | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Cargar catálogos una sola vez
  useEffect(() => {
    fetch("/api/categorias").then(r => r.json()).then(setCategorias);
    fetch("/api/tipos-documento").then(r => r.json()).then(setTiposDoc);
  }, []);

  // Cargar facturas con filtros
  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mesFilter) params.set("mes", mesFilter);
    if (catFilter) params.set("categoria", catFilter);
    const res = await fetch(`/api/facturas?${params}`);
    const data = await res.json();
    setFacturas(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [mesFilter, catFilter]);

  useEffect(() => { fetchFacturas(); }, [fetchFacturas]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await fetch(`/api/facturas/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmDelete(null);
    fetchFacturas();
  };

  const openEdit = (f: Factura) => {
    setEditando({
      ...f,
      fecha: f.fecha.split("T")[0],
      monto: f.monto,
    } as unknown as Factura);
    setModalOpen(true);
  };

  const openNew = () => { setEditando(null); setModalOpen(true); };

  // Mes label
  const [year, month] = mesFilter.split("-");
  const mesLabel = `${MESES[parseInt(month) - 1]} ${year}`;

  const totalMonto = facturas.reduce((s, f) => f.ingreso_gasto === "Gasto" ? s - f.monto : s + f.monto, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B4B] tracking-tight">Facturas</h1>
          <p className="text-sm text-gray-400 mt-1">{mesLabel} · {facturas.length} registros</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2B4B] text-white rounded-xl text-sm font-semibold hover:bg-[#243660] transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva factura
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-[#1B2B4B]/60 uppercase tracking-wider mb-1.5">Mes</label>
          <input type="month" value={mesFilter} onChange={(e) => setMesFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#1B2B4B] focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1B2B4B]/60 uppercase tracking-wider mb-1.5">Categoría</label>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#1B2B4B] focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15 transition-all">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id_categoria_gasto} value={c.id_categoria_gasto}>{c.nombre}</option>
            ))}
          </select>
        </div>
        {(mesFilter || catFilter) && (
          <button onClick={() => { setMesFilter(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`); setCatFilter(""); }}
            className="text-xs text-[#00AEEF] hover:underline font-medium self-end pb-2">
            Limpiar filtros
          </button>
        )}

        {/* Resumen monto */}
        <div className="ml-auto flex items-center gap-2 self-end">
          <span className="text-xs text-gray-400 font-medium">Balance del mes:</span>
          <span className={`text-sm font-bold ${totalMonto >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(Math.abs(totalMonto))} {totalMonto >= 0 ? "↑" : "↓"}
          </span>
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-[#00AEEF]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : facturas.length === 0 ? (
          <EmptyState onNew={openNew} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Proveedor","Fecha","Categoría","Tipo","Monto","Acciones"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {facturas.map((f) => (
                <tr key={f.id_factura} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {f.imagen ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          <Image src={f.imagen} alt={f.proveedor} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                      <span className="text-sm font-semibold text-[#1B2B4B] truncate max-w-[160px]">{f.proveedor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(f.fecha)}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[#00AEEF]/10 text-[#00AEEF]">
                      {f.categoriaGasto?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{f.tipoDocumento?.nombre ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${f.ingreso_gasto === "Gasto" ? "text-red-500" : "text-green-500"}`}>
                      {f.ingreso_gasto === "Gasto" ? "-" : "+"}{formatCurrency(f.monto)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(f)} title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B2B4B] hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      {confirmDelete === f.id_factura ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(f.id_factura)} disabled={deletingId === f.id_factura}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                            {deletingId === f.id_factura ? "..." : "Sí"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(f.id_factura)} title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-[#00AEEF]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : facturas.length === 0 ? (
          <EmptyState onNew={openNew} />
        ) : (
          facturas.map((f) => (
            <div key={f.id_factura} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {f.imagen ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-100">
                      <Image src={f.imagen} alt={f.proveedor} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1B2B4B] truncate">{f.proveedor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.categoriaGasto?.nombre ?? "—"} · {formatDate(f.fecha)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${f.ingreso_gasto === "Gasto" ? "text-red-500" : "text-green-500"}`}>
                    {f.ingreso_gasto === "Gasto" ? "-" : "+"}{formatCurrency(f.monto)}
                  </p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.ingreso_gasto === "Gasto" ? "bg-red-50 text-red-400" : "bg-green-50 text-green-500"}`}>
                    {f.ingreso_gasto}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{f.tipoDocumento?.nombre ?? "—"}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(f)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-medium">
                    Editar
                  </button>
                  {confirmDelete === f.id_factura ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(f.id_factura)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium">Sí</button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-medium">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(f.id_factura)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors font-medium">
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <FacturaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSaved={fetchFacturas}
        inicial={editando as never}
        categorias={categorias}
        tiposDoc={tiposDoc}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-2xl border border-gray-100">
      <div className="w-14 h-14 rounded-2xl bg-[#F7F9FC] flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-400">No hay facturas en este período</p>
      <p className="text-xs text-gray-300 mt-1 mb-5">Cambia los filtros o registra una nueva factura</p>
      <button onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2B4B] text-white rounded-xl text-sm font-semibold hover:bg-[#243660] transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva factura
      </button>
    </div>
  );
}
