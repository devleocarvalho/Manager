"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Target, TrendingUp, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function MetaDoDiaPage() {
  const [cost, setCost] = useState(2.0);
  const [price, setPrice] = useState(5.0);
  const [qty, setQty] = useState(100);
  const [fixedCosts, setFixedCosts] = useState(30.0);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [promoPrice, setPromoPrice] = useState(2.5);

  // Cálculos do Dia
  const totalInvestment = (qty * cost) + fixedCosts;
  const breakevenQty = Math.ceil(totalInvestment / price);
  const maxRevenue = qty * price;
  const maxProfit = maxRevenue - totalInvestment;
  
  const remainingAfterBreakeven = qty - breakevenQty;
  const profitAtPromo = (remainingAfterBreakeven * promoPrice);

  // Panoramas
  const weeklyProfit = maxProfit * daysPerWeek;
  const monthlyProfit = weeklyProfit * 4;

  const weeklyBreakeven = breakevenQty * daysPerWeek;
  const monthlyBreakeven = weeklyBreakeven * 4;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <Target size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Meta do Dia (Simulador de Vendas)
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Descubra quantas vendas você precisa para pagar seu dia e quando é seguro dar descontos.</p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário */}
          <section className="glass rounded-3xl p-6 lg:col-span-1 border border-border h-fit">
            <h3 className="text-lg font-black text-foreground mb-6">Seus Dados de Hoje</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Custo do Produto (R$)</label>
                <input type="number" step="0.01" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Preço de Venda (R$)</label>
                <input type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Quantidade Levada (un)</label>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Gastos do Dia (Transporte, Comida)</label>
                <input type="number" step="0.01" value={fixedCosts} onChange={e => setFixedCosts(Number(e.target.value))} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <hr className="border-border my-4" />
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Dias trabalhados na semana</label>
                <input type="number" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          {/* Resultados */}
          <section className="lg:col-span-2 space-y-8">
            
            {/* Ponto de Empate e Queima */}
            <div className="glass rounded-3xl p-6 relative overflow-hidden border border-border">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={100} /></div>
              <h3 className="text-lg font-black text-foreground mb-2">Seu Ponto de Empate (Breakeven)</h3>
              <p className="text-muted-foreground text-xs mb-6">Para pagar os R$ {totalInvestment.toFixed(2)} que você investiu hoje (mercadoria + gastos da rua)...</p>
              
              <div className="flex items-end gap-4">
                <div className="text-5xl font-black text-primary">{breakevenQty}</div>
                <div className="text-base font-bold text-foreground pb-1">vendas necessárias a R$ {price.toFixed(2)}</div>
              </div>

              {breakevenQty < qty ? (
                <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-2xl">
                  <h4 className="font-bold text-success flex items-center gap-2 mb-2 text-xs">
                    <CheckCircle2 size={18} /> Estratégia de Queima (Desconto Seguro)
                  </h4>
                  <p className="text-foreground/80 text-xs">
                    Após fazer as {breakevenQty} vendas, seu dia está pago. Você terá <strong>{remainingAfterBreakeven} produtos</strong> sobrando. 
                    Tudo que vender a partir daí é lucro limpo. 
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-bold">Simular promoção final por (R$):</span>
                    <input type="number" step="0.01" value={promoPrice} onChange={e => setPromoPrice(Number(e.target.value))} className="w-24 bg-card border border-success/30 rounded-xl p-1 text-foreground text-xs font-bold" />
                  </div>
                  <p className="text-success font-black text-xs mt-2">
                    Vendendo o resto a R$ {promoPrice.toFixed(2)}, você volta pra casa com R$ {profitAtPromo.toFixed(2)} de lucro limpo no bolso e zera a mercadoria!
                  </p>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
                  <h4 className="font-bold text-destructive flex items-center gap-2 mb-2 text-xs">
                    <AlertTriangle size={18} /> Risco de Prejuízo
                  </h4>
                  <p className="text-destructive/80 text-xs">
                    Atenção: A quantidade levada ({qty} un) não paga os custos diários. Ajuste os valores!
                  </p>
                </div>
              )}
            </div>

            {/* Panorama Temporal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-6 border border-border">
                <h3 className="font-black text-foreground mb-4 flex items-center gap-2 text-sm">
                  <TrendingUp size={18} className="text-accent" /> Panorama da Semana
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-border pb-2 text-xs">
                    <span className="text-muted-foreground">Meta de Vendas</span>
                    <span className="text-foreground font-bold">{weeklyBreakeven} un</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2 text-xs">
                    <span className="text-muted-foreground">Se vender tudo normal</span>
                    <span className="text-success font-black">R$ {weeklyProfit.toFixed(2)} (Lucro)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Se faltar 1 dia, você precisa vender {Math.ceil(breakevenQty / (daysPerWeek - 1))} a mais nos outros dias para compensar.
                  </p>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 border border-border">
                <h3 className="font-black text-foreground mb-4 flex items-center gap-2 text-sm">
                  <Calendar size={18} className="text-warning" /> Panorama do Mês
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-border pb-2 text-xs">
                    <span className="text-muted-foreground">Meta de Vendas</span>
                    <span className="text-foreground font-bold">{monthlyBreakeven} un</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2 text-xs">
                    <span className="text-muted-foreground">Se vender tudo normal</span>
                    <span className="text-success font-black">R$ {monthlyProfit.toFixed(2)} (Lucro)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Isso considera {daysPerWeek * 4} dias trabalhados no mês (4 semanas).
                  </p>
                </div>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
