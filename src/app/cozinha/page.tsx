"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useKdsOrders } from "../../hooks/useKdsOrders";
import { OrderCard } from "../../components/kds/OrderCard";
import { ChefHat, Volume2, VolumeX, Clock, Flame, Bell, Scale, Bike, Store, ShieldCheck } from "lucide-react";

export default function CozinhaPage() {
  const { tenantId } = useAuth();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { 
    loading, 
    pendentes, 
    preparando, 
    prontos, 
    updateStatus, 
    pacingFilter, 
    setPacingFilter, 
    salaoCount, 
    deliveryCount 
  } = useKdsOrders(tenantId, audioEnabled);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col">
        {/* Topo do KDS */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <ChefHat size={30} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">KDS Cozinha & Bar</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Esteira de produção com algoritmo de Ritmo Justo (Salão presencial vs. Delivery online).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Sons ativados" : "Sons silenciados"}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled ? "bg-primary/20 text-primary border-primary/40" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Banner de Equilíbrio / Ritmo Justo (Fair Kitchen Pacing) */}
        <div className="mb-6 bg-card border border-border p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase text-foreground">Equilíbrio Cozinha (Salão vs. Delivery)</h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={11} /> Algoritmo Ativo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ordens escalonadas para que os clientes de mesa não sofram atrasos e o estafeta receba o pedido quente no momento exato.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setPacingFilter("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pacingFilter === "todos"
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({salaoCount + deliveryCount})
            </button>
            <button
              onClick={() => setPacingFilter("salao")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                pacingFilter === "salao"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store size={13} /> Salão ({salaoCount})
            </button>
            <button
              onClick={() => setPacingFilter("delivery")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                pacingFilter === "delivery"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bike size={13} /> Online ({deliveryCount})
            </button>
          </div>
        </div>

        {/* Indicadores de Fila */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-amber-500 font-bold">1. Fila de Espera</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{pendentes.length} Pedidos</h3>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl"><Clock size={20} /></div>
          </div>

          <div className="bg-accent/10 border border-accent/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-accent font-bold">2. Em Preparação</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{preparando.length} na Chapa</h3>
            </div>
            <div className="p-2.5 bg-accent/20 text-accent rounded-xl"><Flame size={20} /></div>
          </div>

          <div className="bg-success/10 border border-success/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-success font-bold">3. Balcão de Retirada</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{prontos.length} Prontos</h3>
            </div>
            <div className="p-2.5 bg-success/20 text-success rounded-xl"><Bell size={20} /></div>
          </div>
        </div>

        {/* Colunas Kanban da Esteira */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
          
          {/* Coluna 1: Pendentes */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase text-muted-foreground block">
              Fila de Espera ({pendentes.length})
            </span>
            {pendentes.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                Sem pedidos na fila.
              </div>
            ) : (
              pendentes.map(o => (
                <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />
              ))
            )}
          </div>

          {/* Coluna 2: Em Preparação */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase text-muted-foreground block">
              Na Chapa / Montagem ({preparando.length})
            </span>
            {preparando.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                Nenhum pedido em montagem.
              </div>
            ) : (
              preparando.map(o => (
                <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />
              ))
            )}
          </div>

          {/* Coluna 3: Prontos */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase text-muted-foreground block">
              Pronto para Entrega ({prontos.length})
            </span>
            {prontos.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                Nenhum pedido pronto no balcão.
              </div>
            ) : (
              prontos.map(o => (
                <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
