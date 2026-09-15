"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Sparkles, ShieldAlert, ArrowRight, LogOut, CheckCircle2, Store } from "lucide-react";
import Link from "next/link";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, subscription, loading, logout, tenantProfile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Páginas públicas (não exigem login ou gate de assinatura)
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-foreground">Autenticando Manager SaaS...</p>
        <p className="text-xs text-muted-foreground mt-1">Carregando ambiente seguro e isolado</p>
      </div>
    );
  }

  // Caso o usuário não esteja logado: redireciona ou exibe tela de login necessária
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 max-w-md w-full border border-border text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Acesso Restrito</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            O <strong>Manager</strong> opera em arquitetura SaaS Multi-Tenant protegida. Faça login com a conta do seu estabelecimento para acessar sua base de dados isolada.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-xs"
            >
              Fazer Login ou Criar Conta <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Caso a assinatura esteja expirada (Paywall do SaaS)
  if (subscription.status === "expired") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 max-w-lg w-full border border-destructive/40 bg-destructive/5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={36} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-destructive bg-destructive/20 px-3 py-1 rounded-full">
            Assinatura Expirada
          </span>
          <h2 className="text-2xl font-black text-foreground tracking-tight mt-3">
            Seu período de acesso encerrou
          </h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Os dados do seu estabelecimento (<strong>{tenantProfile?.businessName || 'Meu Estabelecimento'}</strong>) estão salvos e preservados em segurança no banco de dados. Para continuar emitindo pedidos no PDV, gerando comandas e controlando o estoque, ative sua assinatura.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-card border border-border text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CheckCircle2 size={16} className="text-success" /> PDV e Comandas de Mesas ilimitadas
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CheckCircle2 size={16} className="text-success" /> Esteira KDS de Cozinha em tempo real
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CheckCircle2 size={16} className="text-success" /> Controle de Estoque FEFO com leitor de NF-e
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => alert("Simulação de Checkout: Integre com Stripe, Asaas ou Mercado Pago para faturamento automático mensal!")}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-black rounded-xl text-xs shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={15} /> Renovar / Assinar Manager Pro
            </button>
            <button
              onClick={() => logout()}
              className="py-3 px-4 border border-border text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Acesso liberado (Trial ativo ou Plano Ativo)
  return (
    <>
      {/* Banner sutil quando restam poucos dias de teste */}
      {subscription.status === "trial" && subscription.daysRemaining <= 3 && (
        <div className="bg-amber-500 text-black text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <span>⚠️ Você está no período de avaliação gratuita: resta(m) <strong>{subscription.daysRemaining} dia(s)</strong>.</span>
          <button 
            onClick={() => alert("Checkout de assinatura")}
            className="underline text-[11px] font-black uppercase hover:opacity-80"
          >
            Assinar agora
          </button>
        </div>
      )}
      {children}
    </>
  );
}
