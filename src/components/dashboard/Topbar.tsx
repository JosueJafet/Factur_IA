"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

interface TopbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Topbar({ user }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Sidebar drawer en móvil (controlado desde aquí) */}
      <div className="lg:hidden">
        <Sidebar
          user={user}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 h-16 flex items-center gap-4">
        {/* Hamburger — solo móvil */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-[#1B2B4B]/60 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Título de página — lo inyecta cada página via breadcrumb si quiere */}
        <div className="flex-1" />

        {/* Zona derecha */}
        <div className="flex items-center gap-3">
          {/* Notificaciones (placeholder) */}
          <button className="relative p-2 rounded-lg text-[#1B2B4B]/40 hover:bg-gray-100 hover:text-[#1B2B4B] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F47920] rounded-full" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Avatar + nombre */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0D9DA8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name
                ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                : "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#1B2B4B] leading-tight">
                {user?.name ?? "Usuario"}
              </p>
              <p className="text-xs text-gray-400 leading-tight truncate max-w-[140px]">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
