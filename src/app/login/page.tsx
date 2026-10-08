"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { ThemeToggle } from "../../components/common/ThemeToggle";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!businessName.trim()) {
          setErrorMsg("Indique o nome do estabelecimento.");
          setLoading(false);
          return;
        }
        await register(email, password, businessName);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setErrorMsg("E-mail ou palavra-passe incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Este e-mail já se encontra registado.");
      } else {
        setErrorMsg(err.message || "Erro de autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      <div className="flex justify-between items-center max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
            <Store size={26} />
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            Mana<span className="text-primary">ger</span>
          </h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center py-8">
        <div className="bg-card rounded-3xl p-8 max-w-md w-full border border-border shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <ShieldCheck size={14} /> Restaurant OS (Europa)
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {isRegister ? "Criar Conta de Teste" : "Aceder ao Estabelecimento"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isRegister ? "7 dias grátis para o seu restaurante ou bar" : "Insira as credenciais do restaurante"}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-border mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister ? "bg-card text-foreground font-black shadow-sm" : "text-muted-foreground"
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister ? "bg-card text-foreground font-black shadow-sm" : "text-muted-foreground"
              }`}
            >
              Registar
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Nome do Restaurante / Bar *
                </label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Ex: Cervejaria Central, Hamburgueria Prime"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                  />
                  <Store size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                E-mail Profissional *
              </label>
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="gerente@restaurante.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                />
                <Mail size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Palavra-passe *
              </label>
              <div className="relative">
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                />
                <Lock size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? "A processar..." : isRegister ? (
                <>
                  <Sparkles size={16} /> Começar Teste de 7 Dias
                </>
              ) : (
                <>
                  Entrar no Manager <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Manager Restaurant OS - Gestão Gastronómica Europeia
      </div>
    </div>
  );
}
