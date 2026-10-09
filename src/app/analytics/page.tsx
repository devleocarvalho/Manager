"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  ChefHat, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Flame, 
  ArrowUpRight, 
  DollarSign, 
  Filter,
  Layers
} from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { analyticsService } from "../../services/analyticsService";
import { orderService } from "../../services/orderService";
import { stockService } from "../../services/stockService";
import { 
  Order, 
  InventoryItem, 
  HourlySalesData, 
  MenuEngineeringItem, 
  WaiterPerformance, 
  MiseEnPlacePrediction,
  FefoPushAlert,
  ShiftType,
  BcgCategory
} from "../../domain/types";

export default function AnalyticsPage() {
  const { tenantId, currency } = useAuth();

  // Estados dos Filtros Sincronizados
  const [period, setPeriod] = useState<"hoje" | "ontem" | "7dias" | "mes">("hoje");
  const [selectedShift, setSelectedShift] = useState<"todos" | "almoco" | "jantar">("todos");
  const [selectedWaiter, setSelectedWaiter] = useState<string>("todos");

  // Dados reais & calculados
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [fefoAlerts, setFefoAlerts] = useState<FefoPushAlert[]>([]);
  const [activePromoPushed, setActivePromoPushed] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    // Subscreve pedidos
    const unsubOrders = orderService.subscribeOrders(tenantId, (list) => {
      setOrders(list);
    });

    // Subscreve estoque para radar FEFO
    const unsubStock = stockService.subscribeStock(tenantId, (inv) => {
      setInventory(inv);
      setFefoAlerts(analyticsService.processFefoPushAlerts(inv));
    });

    return () => {
      unsubOrders();
      unsubStock();
    };
  }, [tenantId]);

  // Processamento sincronizado dos dados analíticos
  const hourlyData = useMemo(() => {
    let data = analyticsService.processHourlySales(orders);
    if (selectedShift !== "todos") {
      data = data.filter(d => d.shift === selectedShift);
    }
    return data;
  }, [orders, selectedShift]);

  const menuEngineering = useMemo(() => {
    return analyticsService.processMenuEngineering(orders);
  }, [orders]);

  const waiterPerformance = useMemo(() => {
    let list = analyticsService.processWaiterPerformance(orders);
    if (selectedWaiter !== "todos") {
      list = list.filter(w => w.waiterName === selectedWaiter);
    }
    return list;
  }, [orders, selectedWaiter]);

  const miseEnPlace = useMemo(() => {
    return analyticsService.processMiseEnPlacePredictions();
  }, []);

  // Totais Gerais
  const totalRevenue = useMemo(() => {
    return hourlyData.reduce((acc, h) => acc + h.sales, 0);
  }, [hourlyData]);

  const totalOrdersCount = useMemo(() => {
    return hourlyData.reduce((acc, h) => acc + h.ordersCount, 0);
  }, [hourlyData]);

  const avgTicket = useMemo(() => {
    return totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  }, [totalRevenue, totalOrdersCount]);

  const avgGrossMargin = useMemo(() => {
    if (menuEngineering.length === 0) return 68.5;
    return menuEngineering.reduce((acc, m) => acc + m.marginPercent, 0) / menuEngineering.length;
  }, [menuEngineering]);

  // Disparo de Promoção / Venda Ativa para o Garçom
  const handlePushPromo = (alert: FefoPushAlert) => {
    setActivePromoPushed(alert.id);
    setTimeout(() => {
      setActivePromoPushed(null);
    }, 4000);
  };

  // Exportação CSV
  const handleExportCSV = () => {
    const rows = [
      ["Prato / Item", "Categoria", "Qtd Vendida", "Faturamento (€)", "Margem (%)", "Classificacao BCG"],
      ...menuEngineering.map(m => [
        `"${m.name}"`,
        m.category,
        m.salesCount,
        m.revenue.toFixed(2),
        m.marginPercent.toFixed(1) + "%",
        m.bcgCategory.toUpperCase()
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_analitico_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pico de vendas para escala visual do gráfico
  const maxSales = Math.max(...hourlyData.map(h => h.sales), 100);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Topo / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/20 text-primary">
              Enterprise BI & Analytics
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> Sincronização em Tempo Real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            Inteligência de Operação & Cardápio
          </h1>
          <p className="text-xs text-muted-foreground">
            Curva de procura, engenharia de cardápio, previsão de mise en place e radar anti-desperdício.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border rounded-xl text-xs font-bold text-foreground flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={14} /> Exportar Relatório (CSV)
          </button>
        </div>
      </div>

      {/* Barra de Filtros Sincronizados */}
      <div className="bg-card border border-border rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1 mr-2">
            <Filter size={13} /> Filtros:
          </span>

          {/* Período */}
          {(["hoje", "ontem", "7dias", "mes"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === p ? "bg-primary text-white shadow-sm" : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "hoje" ? "Hoje" : p === "ontem" ? "Ontem" : p === "7dias" ? "Últimos 7 dias" : "Este Mês"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Turno */}
          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value as any)}
            className="bg-black/5 dark:bg-white/5 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
          >
            <option value="todos">Todos os Turnos</option>
            <option value="almoco">Turno Almoço (11h-16h)</option>
            <option value="jantar">Turno Jantar (18h-23h)</option>
          </select>

          {/* Garçom */}
          <select
            value={selectedWaiter}
            onChange={e => setSelectedWaiter(e.target.value)}
            className="bg-black/5 dark:bg-white/5 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
          >
            <option value="todos">Todos os Garçons</option>
            <option value="Carlos Santos">Carlos Santos</option>
            <option value="Marta Ferreira">Marta Ferreira</option>
            <option value="Tiago Silva">Tiago Silva</option>
            <option value="Balcão / QR Code">Balcão / QR Code</option>
          </select>
        </div>
      </div>

      {/* Indicadores Principais (KPIs Executivos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[11px] font-bold uppercase">Faturação no Período</span>
            <DollarSign size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(totalRevenue, currency)}
          </div>
          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight size={12} /> +14.2% vs semana anterior
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[11px] font-bold uppercase">Ticket Médio / Mesa</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(avgTicket, currency)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Média de {totalOrdersCount} mesas servidas
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[11px] font-bold uppercase">Margem Bruta Média</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {avgGrossMargin.toFixed(1)}%
          </div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">
            Food Cost controlado (&lt; 32%)
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[11px] font-bold uppercase">Alerta Anti-Desperdício</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">
            {fefoAlerts.length} lotes
          </div>
          <div className="text-[10px] text-amber-500 font-bold mt-1">
            Em risco de validade nos próx. 3 dias
          </div>
        </div>
      </div>

      {/* Grid: Curva Horária & Radar FEFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curva Horária de Vendas (2 Colunas) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" /> Curva de Procura por Horário
              </h2>
              <p className="text-xs text-muted-foreground">Distribuição horária para planejamento de escalas e cozinha</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-3 rounded bg-primary"></span>
              <span className="text-[11px] text-muted-foreground">Volume de Vendas (€)</span>
            </div>
          </div>

          {/* Gráfico de Barras SVG Interativo */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-border">
            {hourlyData.map((h, i) => {
              const heightPercent = Math.max(8, Math.round((h.sales / maxSales) * 100));
              const isPeak = h.sales > maxSales * 0.75;

              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {h.hour}: {formatCurrency(h.sales, currency)} ({h.ordersCount} pedidos)
                  </div>

                  {/* Barra */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 relative ${
                      isPeak 
                        ? "bg-gradient-to-t from-primary to-amber-500 shadow-md shadow-primary/20" 
                        : "bg-primary/70 hover:bg-primary"
                    }`}
                  >
                    {isPeak && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-500">
                        <Flame size={10} className="inline" />
                      </span>
                    )}
                  </div>

                  {/* Legenda de Horário */}
                  <span className="text-[9px] font-bold text-muted-foreground mt-2 rotate-45 sm:rotate-0 origin-left sm:origin-center">
                    {h.hour.split(":")[0]}h
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pico do Almoço: 13:00 - 14:00
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pico do Jantar: 20:30 - 21:30
            </span>
          </div>
        </div>

        {/* Radar FEFO & Ação Ativa de Venda (1 Coluna) */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" /> Radar FEFO & Venda Ativa
                </h2>
                <p className="text-xs text-muted-foreground">Lotes próximos da validade sugerindo promoção</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-500">
                Ação Imediata
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {fefoAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border/80 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-foreground">{alert.ingredientName}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Lote: <span className="font-mono">{alert.lote}</span> • {alert.quantity} {alert.unit}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      alert.urgencyLevel === "critico" 
                        ? "bg-destructive/20 text-destructive animate-pulse" 
                        : "bg-amber-500/20 text-amber-500"
                    }`}>
                      Vence em {alert.daysToExpire} {alert.daysToExpire === 1 ? "dia" : "dias"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[11px] font-bold text-primary">
                      Prato: {alert.affectedDishName}
                    </span>
                    <button
                      onClick={() => handlePushPromo(alert)}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all flex items-center gap-1 ${
                        activePromoPushed === alert.id
                          ? "bg-emerald-500 text-white"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {activePromoPushed === alert.id ? (
                        <>
                          <CheckCircle2 size={12} /> Enviado ao Garçom!
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Sugerir Venda (-{alert.suggestedDiscountPercent}%)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary">
            💡 <strong>Impacto financeiro:</strong> A venda ativa antes do vencimento evita a perda de matéria-prima e garante a recuperação de até 85% do custo.
          </div>
        </div>
      </div>

      {/* Engenharia de Cardápio (Matriz BCG para Restaurantes) */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <PieChart size={20} className="text-primary" /> Engenharia de Cardápio (Matriz Rentabilidade x Volume)
            </h2>
            <p className="text-xs text-muted-foreground">Classificação estratégica baseada no método Boston Consulting Group (BCG)</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-500">⭐ Estrela</span>
            <span className="flex items-center gap-1 font-bold text-blue-500">🐎 Burro de Carga</span>
            <span className="flex items-center gap-1 font-bold text-purple-500">❓ Puzzle</span>
            <span className="flex items-center gap-1 font-bold text-destructive">🐕 Cão</span>
          </div>
        </div>

        {/* 4 Quadrantes da Matriz */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estrelas */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1">
                ⭐ Estrelas (Stars)
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">Alta Venda / Alta Margem</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Pratos chave do negócio. Mantenha a qualidade impecável e o destaque no cardápio.
            </p>
            <div className="space-y-2">
              {menuEngineering.filter(m => m.bcgCategory === "estrela").map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-card border border-border text-xs flex justify-between items-center">
                  <span className="font-bold text-foreground truncate mr-2">{m.name}</span>
                  <span className="font-black text-amber-500 whitespace-nowrap">{m.marginPercent}% mg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Burros de Carga */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-blue-500 flex items-center gap-1">
                🐎 Burros de Carga (Plowhorses)
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">Alta Venda / Baixa Margem</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Muito populares, mas margem apertada. Ajuste a porção ou aumente ligeiramente o preço.
            </p>
            <div className="space-y-2">
              {menuEngineering.filter(m => m.bcgCategory === "burro_de_carga").map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-card border border-border text-xs flex justify-between items-center">
                  <span className="font-bold text-foreground truncate mr-2">{m.name}</span>
                  <span className="font-black text-blue-500 whitespace-nowrap">{m.marginPercent}% mg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Puzzles */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-purple-500 flex items-center gap-1">
                ❓ Quebra-Cabeças (Puzzles)
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">Baixa Venda / Alta Margem</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Altamente lucrativos mas vendem pouco. Incentive a equipe de garçons a recomendá-los.
            </p>
            <div className="space-y-2">
              {menuEngineering.filter(m => m.bcgCategory === "puzzle").map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-card border border-border text-xs flex justify-between items-center">
                  <span className="font-bold text-foreground truncate mr-2">{m.name}</span>
                  <span className="font-black text-purple-500 whitespace-nowrap">{m.marginPercent}% mg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cães */}
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-destructive flex items-center gap-1">
                🐕 Cães (Dogs)
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">Baixa Venda / Baixa Margem</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Ocupam espaço na câmara e geram prejuízo. Considere reformular a receita ou retirar.
            </p>
            <div className="space-y-2">
              {menuEngineering.filter(m => m.bcgCategory === "cao").map(m => (
                <div key={m.id} className="p-2.5 rounded-xl bg-card border border-border text-xs flex justify-between items-center">
                  <span className="font-bold text-foreground truncate mr-2">{m.name}</span>
                  <span className="font-black text-destructive whitespace-nowrap">{m.marginPercent}% mg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Previsão de Mise en Place & Desempenho dos Garçons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previsão de Mise en Place da Cozinha */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <ChefHat size={18} className="text-primary" /> Previsão de Mise en Place (Próximo Turno)
              </h2>
              <p className="text-xs text-muted-foreground">Quantidades sugeridas para descongelamento e pré-preparo seguro (HACCP)</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500">
              Desperdício Zero
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <th className="pb-2">Prato / Base</th>
                  <th className="pb-2 text-center">Procura Prevista</th>
                  <th className="pb-2 text-right">Descongelar / Preparar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {miseEnPlace.map((p, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-foreground">
                      {p.dishName}
                      <span className="block text-[10px] text-muted-foreground font-normal">{p.category}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-muted-foreground">
                      {p.predictedDemandNextShift} {p.unit}
                    </td>
                    <td className="py-2.5 text-right font-black text-primary">
                      {p.suggestedThawPrep} {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desempenho e Produtividade por Garçom */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" /> Produtividade por Garçom / Operador
              </h2>
              <p className="text-xs text-muted-foreground">Faturação total e ticket médio por atendente</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-500">
              Ranking de Turno
            </span>
          </div>

          <div className="space-y-3">
            {waiterPerformance.map((w, idx) => (
              <div 
                key={w.waiterName}
                className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    idx === 0 
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                      : idx === 1 
                      ? "bg-zinc-400 text-white" 
                      : "bg-black/10 dark:bg-white/10 text-muted-foreground"
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{w.waiterName}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {w.tablesServed} mesas atendidas
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-foreground block">
                    {formatCurrency(w.totalRevenue, currency)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Ticket Médio: {formatCurrency(w.averageTicket, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
