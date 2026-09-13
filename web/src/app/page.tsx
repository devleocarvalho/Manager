"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  TrendingUp, 
  UtensilsCrossed, 
  AlertTriangle, 
  CheckCircle2,
  Bell,
  DollarSign,
  ShoppingCart,
  Receipt
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { StockRadar } from "../components/StockRadar";
import { MenuStars } from "../components/MenuStars";
import { ThemeToggle } from "../components/ThemeToggle";

export default function Dashboard() {
  const [loadingData, setLoadingData] = useState(true);
  const [lucroDoDia, setLucroDoDia] = useState(0);
  const [desperdicioTotal, setDesperdicioTotal] = useState(0);
  const [faturamentoBruto, setFaturamentoBruto] = useState(0);
  const [qtdVendas, setQtdVendas] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [cmvMedio, setCmvMedio] = useState(0);

  useEffect(() => {
    // Escutando as transações financeiras em tempo real do Firebase Firestore
    const q = query(
      collection(db, "financial_transactions"),
      where("tenant_id", "==", "tenant-demo")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let income = 0;
      let cmv = 0;
      let loss = 0;
      let salesCount = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'income') {
          income += data.amount;
          if (data.category === 'sales') {
            salesCount += 1;
          }
        }
        if (data.category === 'cmv') cmv += data.amount;
        if (data.category === 'loss') loss += data.amount;
      });

      setLucroDoDia(income - cmv);
      setDesperdicioTotal(loss);
      setFaturamentoBruto(income);
      setQtdVendas(salesCount);
      setTicketMedio(salesCount > 0 ? income / salesCount : 0);
      setCmvMedio(income > 0 ? (cmv / income) * 100 : 0);
      
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Bom dia, Lojista!</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Vamos lucrar hoje? Aqui está o resumo em tempo real do seu negócio.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Gamificação Financeira - Cards Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Faturamento Bruto */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Faturamento Bruto</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? '...' : `R$ ${faturamentoBruto.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <DollarSign size={22} />
              </div>
            </div>
            <p className="text-xs text-primary flex items-center gap-1 font-semibold">
              <TrendingUp size={13} />
              <span>Todo dinheiro que entrou hoje</span>
            </p>
          </div>

          {/* Vendas Realizadas */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Vendas Realizadas</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? '...' : `${qtdVendas} Pedidos`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-accent/20 text-accent">
                <ShoppingCart size={22} />
              </div>
            </div>
            <p className="text-xs text-accent flex items-center gap-1 font-semibold">
              <CheckCircle2 size={13} />
              <span>Clientes atendidos</span>
            </p>
          </div>

          {/* Ticket Médio */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Ticket Médio</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? '...' : `R$ ${ticketMedio.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-success/20 text-success">
                <Receipt size={22} />
              </div>
            </div>
            <p className="text-xs text-success flex items-center gap-1 font-semibold">
              <TrendingUp size={13} />
              <span>Média de gasto por cliente</span>
            </p>
          </div>

          {/* Lucro do Dia */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Lucro do Dia</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? 'Carregando...' : `R$ ${lucroDoDia.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-success/20 text-success">
                <TrendingUp size={22} />
              </div>
            </div>
            <p className="text-xs text-success flex items-center gap-1 font-semibold">
              <TrendingUp size={13} />
              <span>Receitas menos CMV (Custo)</span>
            </p>
          </div>

          {/* Perdas de Estoque */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Perdas de Estoque</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? 'Carregando...' : `R$ ${desperdicioTotal.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-destructive/20 text-destructive">
                <AlertTriangle size={22} />
              </div>
            </div>
            <p className="text-xs text-destructive flex items-center gap-1 font-semibold">
              <AlertTriangle size={13} />
              <span>Sincronizado via Firebase</span>
            </p>
          </div>

          {/* CMV Médio */}
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">CMV Atual</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loadingData ? '...' : `${cmvMedio.toFixed(1)}%`}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <UtensilsCrossed size={22} />
              </div>
            </div>
            <p className={`text-xs flex items-center gap-1 font-semibold ${cmvMedio <= 30 ? 'text-success' : 'text-destructive'}`}>
              <CheckCircle2 size={13} />
              <span>{cmvMedio <= 30 ? 'Saudável (Até 30%)' : 'Atenção! Custos altos'}</span>
            </p>
          </div>
        </div>

        {/* Integrações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StockRadar />
          <MenuStars />
        </div>
      </main>
    </div>
  );
}
