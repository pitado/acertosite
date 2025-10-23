"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Smartphone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginAcerto() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasMin = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passOK = useMemo(
    () => hasMin && hasUpper && hasNumber,
    [hasMin, hasUpper, hasNumber]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    const emailRegex = /[^@]+@[^.]+\..+/;
    if (!emailRegex.test(email)) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (!passOK) {
      setError(
        "A senha precisa ter 8+ caracteres, 1 letra maiúscula e 1 número."
      );
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);

    alert("Login simulado com sucesso! Pronto para integrar com o backend.");
  }

  return (
    <div className="min-h-screen bg-[#0f2a24] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-700/30 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 1.1 }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-600/25 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.1 }}
      />

      <main className="relative grid w-full max-w-6xl gap-8 md:grid-cols-2 items-center">
        {/* Lado esquerdo: headline e features */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-2"
        >
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900/50 px-3 py-1 text-xs uppercase tracking-widest ring-1 ring-emerald-700/40">
              <ShieldCheck className="h-3.5 w-3.5" /> Beta MVP
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              <motion.span
                className="inline-block text-emerald-300 cursor-pointer select-none"
                aria-label="AcertÔ logo"
                title="AcertÔ"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{
                  color: "#6ee7b7",
                  textShadow: "0 2px 16px rgba(110,231,183,0.65)",
                  scale: 1.05,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                AcertÔ
              </motion.span>
            </h1>
            <motion.p
              className="mt-3 max-w-lg mx-auto text-[#6ee7b7]"
              style={{ textShadow: "0 0 10px rgba(110,231,183,0.55)" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              A conta vai, a amizade fica.
            </motion.p>
          </div>

          <ul className="mt-6 space-y-3 text-emerald-100/90 pl-2">
            {[
              "Crie grupos e registre despesas em segundos.",
              "Veja quem deve para quem com cálculo otimizado.",
              "Integração PIX para pagamentos instantâneos.",
            ].map((txt, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 mt-[1px]" />
                <span className="leading-tight">{txt}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4 text-sm text-emerald-200/80">
            <div className="flex items-center gap-2 hover:text-emerald-100 transition">
              <Smartphone className="h-4 w-4" /> Responsivo
            </div>
            <div className="flex items-center gap-2 hover:text-emerald-100 transition">
              <Mail className="h-4 w-4" /> Suporte rápido
            </div>
          </div>
        </motion.section>

        {/* Lado direito: formulário */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="px-2"
        >
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 250, damping: 22 }}
          >
            <Card className="bg-emerald-900/50 border-emerald-800/60 text-emerald-50 shadow-xl rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 text-center">
                  <p className="text-xs text-emerald-100/70 tracking-widest uppercase">
                    Bem-vindo(a) ao
                  </p>
                  <p className="text-3xl font-extrabold mt-1">
                    <motion.span
                      className="inline-block text-emerald-300 cursor-pointer select-none"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{
                        color: "#6ee7b7",
                        textShadow:
                          "0 2px 16px rgba(110,231,183,0.65)",
                        scale: 1.05,
                      }}
                    >
                      AcertÔ
                    </motion.span>
                  </p>
                  <motion.p
                    className="mt-2 text-sm text-[#6ee7b7]"
                    style={{ textShadow: "0 0 10px rgba(110,231,183,0.55)" }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12 }}
                  >
                    A conta vai, a amizade fica.
                  </motion.p>
                </div>

                {/* Botões visuais (placeholder). Quando formos configurar NextAuth, ligamos neles. */}
                <div className="space-y-3 mb-5">
                  <Button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-gray-700 border border-gray-300 h-11 hover:shadow-lg hover:-translate-y-[1px] transition font-medium"
                  >
                    <img
                      src="https://developers.google.com/identity/images/g-logo.png"
                      alt="Google logo"
                      className="h-5 w-5"
                    />
                    Entrar com Google
                  </Button>
                  <Button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-black text-white border border-gray-700 h-11 hover:shadow-lg hover:-translate-y-[1px] transition font-medium"
                  >
                    <img
                      src="https://abs.twimg.com/icons/apple-touch-icon-192x192.png"
                      alt="X logo"
                      className="h-5 w-5"
                    />
                    Entrar com X
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-emerald-100">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@email.com"
                      className="bg-emerald-950/40 border-emerald-800/70 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-emerald-100">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-emerald-950/40 border-emerald-800/70 pr-10 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        className="absolute inset-y-0 right-2 grid place-items-center px-2 text-emerald-200/80 hover:text-emerald-100"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <ul className="text-xs space-y-1">
                      <li
                        className={`flex items-center gap-2 ${
                          hasMin ? "text-emerald-300" : "text-emerald-200/70"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${hasMin ? "" : "opacity-50"}`}
                        />{" "}
                        Mínimo de 8 caracteres
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          hasUpper ? "text-emerald-300" : "text-emerald-200/70"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${
                            hasUpper ? "" : "opacity-50"
                          }`}
                        />{" "}
                        Pelo menos 1 letra maiúscula
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          hasNumber ? "text-emerald-300" : "text-emerald-200/70"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${
                            hasNumber ? "" : "opacity-50"
                          }`}
                        />{" "}
                        Pelo menos 1 número
                      </li>
                    </ul>
                  </div>

                  {error && (
                    <div className="text-sm text-red-200/90 bg-red-900/40 border border-red-800/50 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:-translate-y-[1px] text-emerald-950 font-semibold transition"
                  >
                    <LogIn className="h-5 w-5 mr-2" />{" "}
                    {loading ? "Entrando…" : "Entrar"}
                  </Button>

                  <div className="flex items-center justify-between text-sm text-emerald-100/80">
                    <a href="#" className="hover:underline">
                      Esqueci minha senha
                    </a>
                    <a href="#" className="hover:underline">
                      Criar conta
                    </a>
                  </div>

                  <div className="pt-1 text-xs text-emerald-100/60">
                    Ao entrar, você concorda com nossos Termos e Política de
                    Privacidade.
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>
      </main>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-emerald-100/60">
        © {new Date().getFullYear()} AcertÔ — A conta vai, a amizade fica
      </footer>
    </div>
  );
}
