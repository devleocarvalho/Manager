"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Store, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck,
  Zap
} from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, register, resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoadingAction(true);

    try {
      if (isRegister) {
        if (!businessName.trim()) {
          setErrorMsg("Por favor, informe o nome do seu estabelecimento.");
          setLoadingAction(false);
          return;
        }
        await register(email, password, businessName);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErrorMsg(err.message || "Erro ao autenticar. Verifique sua conexão.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setErrorMsg("Informe seu e-mail para receber as instruções de recuperação.");
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e: any) {
      setErrorMsg("Erro ao enviar e-mail de recuperação.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      {/* Topo com Logo e Theme Toggle */}
      <div className="flex justify-between items-center max-w-6xl w-full mx-auto">
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

      {/* Centro: Card de Login / Cadastro */}
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="glass rounded-3xl p-8 max-w-md w-full border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header do Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <ShieldCheck size={14} />
              <span>Ambiente Seguro Multi-Tenant</span>
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {isRegister ? "Comece seu Teste Grátis" : "Acesse seu Estabelecimento"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isRegister 
                ? "7 dias de acesso completo sem compromisso" 
                : "Entre com suas credenciais de assinante"}
            </p>
          </div>

          {/* Seletor de Abas */}
          <div className="grid grid-cols-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-border mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister 
                  ? "bg-card text-foreground shadow-sm font-black" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Fazer Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister 
                  ? "bg-card text-foreground shadow-sm font-black" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Alertas */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent && (
            <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>E-mail de recuperação enviado com sucesso!</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Nome do Estabelecimento *
                </label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Ex: Burger Prime, Lanchonete Central"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
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
                  placeholder="gerente@seunegocio.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                />
                <Mail size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase">
                  Senha *
                </label>
                {!isRegister && (
                  <button 
                    type="button" 
                    onClick={handleReset}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary"
                />
                <Lock size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingAction}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-black text-xs shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loadingAction ? (
                <span>Autenticando...</span>
              ) : isRegister ? (
                <>
                  <Sparkles size={16} /> Criar Conta e Iniciar 7 Dias Grátis
                </>
              ) : (
                <>
                  Entrar no Manager <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Destaques do SaaS */}
          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground">
              {isRegister 
                ? "Sem cartão de crédito necessário para o teste." 
                : "Seu estabelecimento conta com banco de dados seguro e isolado."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Manager SaaS - Plataforma de Gestão Comercial e Gastronômica
      </div>
    </div>
  );
}
