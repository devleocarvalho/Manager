"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { usePathname } from "next/navigation";
import { Lock, ArrowRight, ShieldAlert, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, subscription, loading, logout, tenantProfile } = useAuth();
  const pathname = usePathname();

  // Rotas públicas (cardápio via QR Code e login não exigem autenticação do dono)
  const isPublic = pathname === "/login" || pathname.startsWith("/cardapio");
  if (isPublic) {
    return <>{children}</>;
  }

  // Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-foreground">A carregar Restaurant OS...</p>
        <p className="text-xs text-muted-foreground mt-1">Ambiente seguro multi-tenant</p>
      </div>
    );
  }

  // Não logado
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 max-w-md w-full border border-border text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Acesso Reservado</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Inicie sessão com a conta do seu estabelecimento para aceder à base de dados de gestão.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-xs"
            >
              Iniciar Sessão ou Criar Conta <ArrowRight size={15} />
            </Link>
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
            <ShieldAlert size={36} />
          </div>
          <span className="text-[11px] font-black uppercase text-destructive bg-destructive/20 px-3 py-1 rounded-full">
            Subscrição Expirada
          </span>
          <h2 className="text-2xl font-black text-foreground tracking-tight mt-3">
            O período de teste terminou
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Os dados do <strong>{tenantProfile?.businessName || 'estabelecimento'}</strong> estão salvaguardados com segurança. Ative a sua subscrição para continuar a emitir pedidos e faturar.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => alert("Checkout de subscrição")}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles size={16} /> Ativar Plano Pro
            </button>
            <button
              onClick={() => logout()}
              className="py-3 px-4 border border-border text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
