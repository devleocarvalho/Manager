"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/navigation/Sidebar";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { financeService } from "../services/financeService";
import { formatCurrency } from "../lib/currency";
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  DollarSign, 
  UtensilsCrossed, 
  AlertTriangle, 
  CheckCircle2,
  Bell
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { tenantId, currency, tenantProfile } = useAuth();
  const [faturamento, setFaturamento] = useState(0);
  const [cmv, setCmv] = useState(0);
  const [pedidosCount, setPedidosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const unsub = financeService.subscribeTransactions(tenantId, (txs) => {
      let income = 0;
      let cost = 0;
      let count = 0;

      txs.forEach(t => {
        if (t.type === "income") {
          income += t.amount;
          count += 1;
        }
        if (t.category === "cmv") cost += t.amount;
      });

      setFaturamento(income);
      setCmv(cost);
      setPedidosCount(count);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  const lucro = faturamento - cmv;
  const ticketMedio = pedidosCount > 0 ? faturamento / pedidosCount : 0;
  const cmvPct = faturamento > 0 ? (cmv / faturamento) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Olá, {tenantProfile?.businessName || "Gerente"}!
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Resumo em tempo real da faturação e operação do seu estabelecimento.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Métricas Principais em Euro (€) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Faturação Bruta</span>
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : formatCurrency(faturamento, currency)}
            </div>
            <p className="text-[11px] text-primary flex items-center gap-1 font-semibold mt-1">
              <TrendingUp size={12} /> Entradas de hoje
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Vendas Realizadas</span>
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                <ShoppingCart size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : `${pedidosCount} Pedidos`}
            </div>
            <p className="text-[11px] text-accent flex items-center gap-1 font-semibold mt-1">
              <CheckCircle2 size={12} /> Clientes faturados
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Ticket Médio</span>
              <div className="p-2.5 rounded-xl bg-success/20 text-success">
                <Receipt size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : formatCurrency(ticketMedio, currency)}
            </div>
            <p className="text-[11px] text-success flex items-center gap-1 font-semibold mt-1">
              <TrendingUp size={12} /> Gasto médio por mesa
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Lucro Operacional</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : formatCurrency(lucro, currency)}
            </div>
            <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold mt-1">
              <CheckCircle2 size={12} /> Faturação menos CMV
            </p>
          </div>

        </div>

        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/mesas"
            className="p-6 rounded-3xl bg-card border border-border hover:border-primary transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl mb-3 group-hover:bg-primary group-hover:text-white transition-all">
                <UtensilsCrossed size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground">Gestão de Mesas & Salão</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Visualização do salão em tempo real, pedidos, comandas e impressão de QR Codes.
              </p>
            </div>
            <span className="text-xs font-bold text-primary mt-4 flex items-center gap-1">
              Aceder Mesas →
            </span>
          </Link>

          <Link
            href="/garcom"
            className="p-6 rounded-3xl bg-card border border-border hover:border-primary transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-amber-500/10 text-amber-500 w-fit rounded-2xl mb-3 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ShoppingCart size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground">Terminal do Garçom</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Aplicação de bolso para smartphone com atendimento rápido de uma só mão.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-500 mt-4 flex items-center gap-1">
              Abrir Modo Garçom →
            </span>
          </Link>

          <Link
            href="/cozinha"
            className="p-6 rounded-3xl bg-card border border-border hover:border-primary transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-accent/10 text-accent w-fit rounded-2xl mb-3 group-hover:bg-accent group-hover:text-white transition-all">
                <Bell size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground">KDS Esteira de Cozinha</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Monitor de produção em tempo real com fila de espera, chapa e alertas sonoros.
              </p>
            </div>
            <span className="text-xs font-bold text-accent mt-4 flex items-center gap-1">
              Abrir KDS Cozinha →
            </span>
          </Link>
        </div>

      </main>
    </div>
  );
}
