import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2, Mail, Lock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Tela de Cadastro (Sign Up) – AcertÔ
 * Padrões visuais: verde escuro, micro-animações, tipografia/brand iguais à tela de login
 * Validações: e‑mail, senha (>=8, 1 maiúscula, 1 número), confirmação de senha, aceitar termos
 * Social sign-up: Google e X (com fallback para redirect caso NextAuth não esteja configurado)
 * Placeholder MySQL: espaço para integração posterior
 */
export default function SignupAcerto() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasMin = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passOK = useMemo(() => hasMin && hasUpper && hasNumber, [hasMin, hasUpper, hasNumber]);
  const passMatch = password && password2 && password === password2;

  const emailRegex = /[^@]+@[^.]+\..+/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!name.trim()) return setError("Informe seu nome.");
    if (!emailRegex.test(email)) return setError("Digite um e‑mail válido.");
    if (!passOK) return setError("A senha precisa ter 8+ caracteres, 1 letra maiúscula e 1 número.");
    if (!passMatch) return setError("As senhas não conferem.");
    if (!accept) return setError("Você precisa aceitar os Termos para criar a conta.");

    setLoading(true);
    // Simulação de chamada ao backend. Depois integrar com API + MySQL.
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSuccess("Conta criada! Faça login para continuar.");
  }

  // Sign-in Social seguro (tenta NextAuth dinamicamente, senão redireciona)
  async function socialSignIn(provider: "google" | "twitter") {
    try {
      const mod = await import("next-auth/react");
      await mod.signIn(provider);
    } catch (_) {
      window.location.href = `/api/auth/signin/${provider}`;
    }
  }

  return (
    <div className="min-h-screen bg-[#0f2a24] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbes sutis */}
      <motion.div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-700/30 blur-3xl" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ duration: 1.1 }} />
      <motion.div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-600/25 blur-3xl" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.6, scale: 1 }} transition={{ duration: 1.2, delay: 0.1 }} />

      <main className="relative w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Branding/benefícios */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="px-2 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            <motion.span className="inline-block text-emerald-300" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ color: '#6ee7b7', textShadow: '0 2px 16px rgba(110,231,183,0.65)', scale: 1.05 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>AcertÔ</motion.span>
          </h1>
          <motion.p className="mt-3 max-w-lg mx-auto text-[#6ee7b7]" style={{ textShadow: '0 0 10px rgba(110,231,183,0.55)' }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
            A conta vai, a amizade fica.
          </motion.p>

          <ul className="mt-6 space-y-3 text-emerald-100/90 pl-2 text-left mx-auto max-w-md">
            {['Crie grupos ilimitados (no Premium).', 'Despesas em segundos, cálculo otimizado.', 'Integração PIX para pagar na hora.'].map((txt, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 mt-[1px]" />
                <span className="leading-tight">{txt}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Card de cadastro */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="px-2">
          <Card className="bg-emerald-900/50 border-emerald-800/60 text-emerald-50 shadow-xl rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-xs text-emerald-100/70 tracking-widest uppercase">Comece grátis</p>
                <p className="text-2xl font-extrabold mt-1">Crie sua conta</p>
              </div>

              {/* Social */}
              <div className="space-y-3 mb-5" data-testid="social-signup">
                <Button type="button" onClick={() => socialSignIn('google')} className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-gray-700 border border-gray-300 h-11 hover:shadow-lg hover:-translate-y-[1px] transition font-medium">
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5" />
                  Criar com Google
                </Button>
                <Button type="button" onClick={() => socialSignIn('twitter')} className="w-full flex items-center justify-center gap-3 rounded-xl bg-black text-white border border-gray-700 h-11 hover:shadow-lg hover:-translate-y-[1px] transition font-medium">
                  <img src="https://abs.twimg.com/icons/apple-touch-icon-192x192.png" alt="X logo" className="h-5 w-5" />
                  Criar com X
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-emerald-800/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-emerald-900/40 px-3 text-xs text-emerald-100/70 rounded-full">ou crie com e‑mail</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5" data-testid="signup-form">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <div className="relative">
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="bg-emerald-950/40 border-emerald-800/70 pr-9 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition" />
                      <User className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200/80" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E‑mail</Label>
                    <div className="relative">
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="bg-emerald-950/40 border-emerald-800/70 pr-9 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition" />
                      <Mail className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200/80" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" className="bg-emerald-950/40 border-emerald-800/70 pr-10 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition" minLength={8} />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-2 grid place-items-center px-2 text-emerald-200/80 hover:text-emerald-100">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Regras dinâmicas */}
                    <ul className="text-xs space-y-1">
                      <li className={`flex items-center gap-2 ${hasMin ? 'text-emerald-300' : 'text-emerald-200/70'}`}><CheckCircle2 className={`h-3.5 w-3.5 ${hasMin ? '' : 'opacity-50'}`} /> Mínimo de 8 caracteres</li>
                      <li className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-300' : 'text-emerald-200/70'}`}><CheckCircle2 className={`h-3.5 w-3.5 ${hasUpper ? '' : 'opacity-50'}`} /> Pelo menos 1 letra maiúscula</li>
                      <li className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-300' : 'text-emerald-200/70'}`}><CheckCircle2 className={`h-3.5 w-3.5 ${hasNumber ? '' : 'opacity-50'}`} /> Pelo menos 1 número</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Confirmar Senha</Label>
                    <div className="relative">
                      <Input id="password2" type={showPassword2 ? "text" : "password"} value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repita a senha" className="bg-emerald-950/40 border-emerald-800/70 pr-10 focus-visible:ring-emerald-400 hover:border-emerald-400/70 transition" />
                      <button type="button" onClick={() => setShowPassword2((s) => !s)} aria-label={showPassword2 ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-2 grid place-items-center px-2 text-emerald-200/80 hover:text-emerald-100">
                        {showPassword2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {!passMatch && password2.length > 0 && (
                      <p className="text-xs text-red-200">As senhas não conferem.</p>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-emerald-100/90 cursor-pointer select-none">
                  <input type="checkbox" className="mt-[3px] accent-emerald-500" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                  <span>Eu li e aceito os <a className="underline hover:text-emerald-300" href="#">Termos de Uso</a> e a <a className="underline hover:text-emerald-300" href="#">Política de Privacidade</a>.</span>
                </label>

                {error && <div className="text-sm text-red-200/90 bg-red-900/40 border border-red-800/50 rounded-lg p-3">{error}</div>}
                {success && <div className="text-sm text-emerald-200/90 bg-emerald-900/40 border border-emerald-700/50 rounded-lg p-3">{success}</div>}

                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:-translate-y-[1px] text-emerald-950 font-semibold transition">
                  <UserPlus className="h-5 w-5 mr-2" /> {loading ? "Criando…" : "Criar conta"}
                </Button>

                <p className="text-sm text-emerald-100/80 text-center">Já tem conta? <a href="/login" className="underline hover:text-emerald-300">Entrar</a></p>
              </form>

              {/* Placeholder para integração MySQL */}
              <div className="mt-6 rounded-xl border border-dashed border-emerald-700/60 bg-emerald-950/30 p-4 text-xs text-emerald-100/70">
                <p className="font-semibold mb-1">Banco de dados (MySQL) — placeholder</p>
                <p>Endpoint planejado: POST /api/auth/signup → cria usuário, valida regras, envia welcome e grava no MySQL.</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-emerald-100/60">© {new Date().getFullYear()} AcertÔ — A conta vai, a amizade fica</footer>
    </div>
  );
}

/*
=============================================================
TEST CASES (pseudo, React Testing Library)
=============================================================
1) Renderiza e mostra elementos básicos:
   - render(<SignupAcerto />)
   - getByText('Crie sua conta'), getByText('AcertÔ')

2) Valida nome obrigatório:
   - deixar tudo vazio → submit → exibir "Informe seu nome."

3) Valida e‑mail:
   - email "abc" → submit → "Digite um e‑mail válido."

4) Regras de senha:
   - senha "Aa123456" ativa as três regras (classe text-emerald-300)

5) Confirmação de senha:
   - senha1 "Aa123456", senha2 "Aa1234567" → exibe "As senhas não conferem."

6) Aceite dos termos:
   - sem marcar checkbox → submit → "Você precisa aceitar os Termos..."

7) Social buttons presentes:
   - getByTestId('social-signup') e clicar → não deve quebrar mesmo sem NextAuth (fallback redirect)
*/
