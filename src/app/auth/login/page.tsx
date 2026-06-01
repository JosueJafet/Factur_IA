"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [regNombre, setRegNombre] = useState("");
  const [regCorreo, setRegCorreo] = useState("");
  const [regContrasena, setRegContrasena] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      correo,
      contrasena,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Correo o contraseña incorrectos.");
    } else {
      router.push("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (regContrasena !== regConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: regNombre,
        correo: regCorreo,
        contrasena: regContrasena,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear la cuenta.");
    } else {
      setSuccess("¡Cuenta creada correctamente!");

      setRegNombre("");
      setRegCorreo("");
      setRegContrasena("");
      setRegConfirm("");

      setTimeout(() => {
        setSuccess("");
        setTab("login");
      }, 1800);
    }
  };

  const inputClass =
    "w-full h-14 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-500/10";

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden flex items-center justify-center px-6 py-10">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-300px] left-[-200px] w-[700px] h-[700px] bg-cyan-500/20 rounded-full blur-[140px]" />

        <div className="absolute bottom-[-300px] right-[-200px] w-[700px] h-[700px] bg-blue-700/20 rounded-full blur-[140px]" />

        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:90px_90px]" />

      {/* MAIN CARD */}
      <div className="relative z-10 w-full max-w-7xl rounded-[36px] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.7)] grid lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-between p-16 relative border-r border-white/10">
          <div>
            <Image
              src="/assets/LOGO.png"
              alt="FacturIA"
              width={190}
              height={70}
              priority
            />

            <div className="mt-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 text-xs font-semibold tracking-wide">
                ✦ Inteligencia Artificial Integrada
              </div>

              <h1 className="mt-8 text-6xl font-black leading-[1.02] tracking-tight text-white">
                Controla tus
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {" "}
                  facturas
                </span>
                <br />
                de manera inteligente.
              </h1>

              <p className="mt-7 text-lg text-white/45 leading-relaxed max-w-xl">
                Gestiona documentos, automatiza procesos contables y mejora la
                productividad de tu negocio con una plataforma moderna y segura.
              </p>
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid gap-5 mt-14">
            {[
              "Reconocimiento automático con IA",
              "Análisis inteligente de documentos",
              "Dashboard moderno y organizado",
            ].map((feature) => (
              <div
                key={feature}
                className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 px-5 py-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/10 flex items-center justify-center text-cyan-300 text-lg">
                  ✦
                </div>

                <div>
                  <p className="text-white/80 font-medium">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            {/* MOBILE LOGO */}
            <div className="lg:hidden flex justify-center mb-10">
              <Image
                src="/assets/LOGO.png"
                alt="FacturIA"
                width={170}
                height={70}
                priority
              />
            </div>

            {/* TAB SWITCH */}
            <div className="relative flex bg-white/[0.04] border border-white/10 rounded-2xl p-1 mb-10">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setError("");
                    setSuccess("");
                  }}
                  className={`relative flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    tab === t
                      ? "bg-white text-[#030712] shadow-2xl"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>

            {/* HEADER */}
            <div className="mb-8">
              <h2 className="text-5xl font-black tracking-tight text-white leading-none">
                {tab === "login"
                  ? "Bienvenido."
                  : "Crea tu cuenta."}
              </h2>

              <p className="mt-4 text-white/40 text-base leading-relaxed">
                {tab === "login"
                  ? "Ingresa para continuar a tu dashboard."
                  : "Completa los datos para comenzar."}
              </p>
            </div>

            {/* LOGIN */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@empresa.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Contraseña
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-14`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-all"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && <ErrorAlert msg={error} />}

                <SubmitButton
                  loading={loading}
                  label="Entrar al sistema"
                />
              </form>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    required
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    required
                    value={regCorreo}
                    onChange={(e) => setRegCorreo(e.target.value)}
                    placeholder="correo@empresa.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Contraseña
                  </label>

                  <input
                    type="password"
                    required
                    value={regContrasena}
                    onChange={(e) => setRegContrasena(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-3">
                    Confirmar contraseña
                  </label>

                  <input
                    type="password"
                    required
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                {error && <ErrorAlert msg={error} />}
                {success && <SuccessAlert msg={success} />}

                <SubmitButton
                  loading={loading}
                  label="Crear cuenta"
                />
              </form>
            )}

            {/* FOOTER */}
            <div className="mt-10 text-center">
              <p className="text-white/25 text-sm">
                FacturIA © 2026 · Seguridad y automatización inteligente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 backdrop-blur-xl">
      {msg}
    </div>
  );
}

function SuccessAlert({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300 backdrop-blur-xl">
      {msg}
    </div>
  );
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative overflow-hidden w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] shadow-[0_10px_40px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:hover:scale-100"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] translate-x-[-120%] group-hover:translate-x-[120%]" />

      <span className="relative z-10">
        {loading ? "Procesando..." : label}
      </span>
    </button>
  );
}