"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePathname } from "next/navigation";
import { Lock, ArrowRight, ShieldAlert, Sparkles, LogOut, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode, subscription, loading, logout, loginAsDemo, tenantProfile } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const pathname = usePathname();

  // Rotas públicas (cardápio via QR Code e login não exigem autenticação do dono)
  const isPublic = pathname === "/login" || pathname.startsWith("/cardapio");
  if (isPublic) {
    return <>{children}</>;
  }

  // Carregamento
  if (loading || demoLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-foreground">A carregar Restaurant OS...</p>
        <p className="text-xs text-muted-foreground mt-1">Ambiente seguro multi-tenant</p>
      </div>
    );
  }

  const handleDemoClick = async () => {
    setDemoLoading(true);
    try {
      await loginAsDemo();
    } finally {
      setDemoLoading(false);
    }
  };

  // Não logado nem em modo demo
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 max-w-md w-full border border-border text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Acesso Reservado</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Inicie sessão com a sua conta ou entre instantaneamente com o perfil de demonstração para testar todas as funcionalidades.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {/* Botão de 1 clique para entrar no modo demonstração */}
            <button
              onClick={handleDemoClick}
              className="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm"
            >
              <Sparkles size={18} /> Entrar em Modo Demonstração (1 Clique)
            </button>

            {/* Opção para login real */}
            <Link
              href="/login"
              className="w-full py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground font-bold rounded-2xl flex items-center justify-center gap-2 border border-border transition-all text-xs"
            >
              Iniciar Sessão ou Criar Conta <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Mesas, Garçom, KDS e PDV liberados</span>
          </div>
        </div>
      </div>
    );
  }

  // Assinatura expirada
  if (subscription.status === "expired") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 max-w-lg w-full border border-destructive/40 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Período de Teste Concluído</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            O período experimental do estabelecimento <strong>{tenantProfile?.businessName || "Restaurant OS"}</strong> terminou. 
            Ative uma licença comercial para continuar a gerir mesas, KDS e pedidos.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-foreground">Plano Restaurant OS Europa</span>
              <span className="text-xs font-black text-primary">€49,00 / mês</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mesas ilimitadas, KDS ilimitado, Cardápio QR Code de clientes e suporte a IVA europeu.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleDemoClick}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-xs"
            >
              <Sparkles size={16} /> Continuar em Modo Demonstração
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 text-xs text-muted-foreground font-semibold hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut size={14} /> Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
