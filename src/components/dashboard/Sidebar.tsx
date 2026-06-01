"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Facturas",
    href: "/dashboard/facturas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    label: "Categorías",
    href: "/dashboard/categorias",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    label: "Reportes",
    href: "/dashboard/reportes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: "Envíos",
    href: "/dashboard/envios",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
];

export default function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // Cerrar sidebar en móvil al cambiar ruta
  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/auth/login" });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
  className={`
    fixed top-0 left-0 h-full w-72
    bg-[#050816]
    backdrop-blur-3xl
    border-r border-white/10
    flex flex-col
    z-40
    overflow-hidden
    transition-transform duration-300 ease-in-out
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
>
  {/* Glow Effects */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-32 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-[120px]" />
    <div className="absolute bottom-0 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-[120px]" />
  </div>

  {/* Header */}
  <div className="relative px-6 py-7 border-b border-white/10">
    <div className="flex items-center">
      <Image
        src="/assets/LOGO.png"
        alt="FacturIA"
        width={145}
        height={60}
        priority
      />

      <button
        onClick={onClose}
        className="ml-auto lg:hidden text-white/40 hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/25">
      Intelligent Accounting
    </p>
  </div>

  {/* Welcome Card */}
  <div className="px-4 pt-5">
    <div className="rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 backdrop-blur-xl">
      <p className="text-white font-semibold">
        Bienvenido 👋
      </p>

      <p className="text-white/40 text-xs mt-1 leading-relaxed">
        Gestiona facturas, reportes y categorías desde una sola plataforma.
      </p>
    </div>
  </div>

  {/* Navigation */}
  <nav className="relative flex-1 px-4 py-5 overflow-y-auto">
    <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 px-3 mb-4">
      Navegación
    </p>

    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex items-center gap-3
              px-4 py-3
              rounded-2xl
              text-sm font-medium
              transition-all duration-300

              ${
                isActive
                  ? `
                    bg-gradient-to-r
                    from-cyan-500/15
                    to-blue-500/10
                    border border-cyan-400/10
                    text-white
                    shadow-[0_0_25px_rgba(6,182,212,0.15)]
                  `
                  : `
                    text-white/50
                    hover:text-white
                    hover:bg-white/[0.04]
                  `
              }
            `}
          >
            {isActive && (
              <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
            )}

            <span
              className={`
                transition-all duration-300
                ${isActive
                  ? "text-cyan-300 scale-110"
                  : "text-white/40"}
              `}
            >
              {item.icon}
            </span>

            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  </nav>

  {/* User Section */}
  <div className="relative p-4 border-t border-white/10">
    <Link
      href="/dashboard/perfil"
      className={`
        flex items-center gap-4
        rounded-3xl
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-4
        transition-all duration-300

        ${
          pathname === "/dashboard/perfil"
            ? "border-cyan-400/20 bg-cyan-500/5"
            : "hover:bg-white/[0.05]"
        }
      `}
    >
      <div
        className="
          w-12 h-12
          rounded-2xl
          bg-gradient-to-br
          from-cyan-400
          to-blue-600
          flex items-center justify-center
          text-white font-bold
          shadow-[0_0_25px_rgba(6,182,212,0.35)]
          flex-shrink-0
        "
      >
        {initials}
      </div>

      <div className="min-w-0">
        <p className="text-white font-medium truncate">
          {user?.name ?? "Usuario"}
        </p>

        <p className="text-white/35 text-xs truncate">
          {user?.email ?? ""}
        </p>
      </div>
    </Link>

    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="
        mt-3
        w-full
        flex items-center gap-3
        px-4 py-3
        rounded-2xl
        text-sm font-medium
        border border-red-500/10
        bg-red-500/5
        text-white/60
        hover:text-red-300
        hover:bg-red-500/15
        hover:border-red-500/20
        transition-all duration-300
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
        />
      </svg>

      {signingOut ? "Saliendo..." : "Cerrar sesión"}
    </button>
  </div>
</aside>
    </>
  );
}
