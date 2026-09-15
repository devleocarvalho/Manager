"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Package, 
  DollarSign, 
  Clock, 
  ShoppingCart, 
  AlertTriangle, 
  ArrowUpRight, 
  ChevronRight, 
  CheckCircle2,
  PieChart,
  Boxes,
  Truck
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface OrderItem {
  name: string;
  category?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  order_number: number;
  customer_name: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  created_at: string;
}

// Insumos associados a lanches padrão para o motor preditivo
const INGREDIENT_MAP: Record<string, Array<{ name: string; qtyPerItem: number; unit: string }>> = {
  "Smash Burger Duplo": [
    { name: "Pão Brioche", qtyPerItem: 1, unit: "un" },
    { name: "Blend Bovino (Carne)", qtyPerItem: 180, unit: "g" },
    { name: "Queijo Cheddar", qtyPerItem: 2, unit: "fatias" },
    { name: "Molho Especial", qtyPerItem: 30, unit: "ml" },
    { name: "Embalagem Térmica", qtyPerItem: 1, unit: "un" }
  ],
  "Mega Bacon Crispy": [
    { name: "Pão Brioche", qtyPerItem: 1, unit: "un" },
    { name: "Blend Bovino (Carne)", qtyPerItem: 160, unit: "g" },
    { name: "Bacon Fatiado", qtyPerItem: 60, unit: "g" },
    { name: "Maionese Defumada", qtyPerItem: 30, unit: "ml" },
    { name: "Embalagem Térmica", qtyPerItem: 1, unit: "un" }
  ],
  "Cheese Chicken Salada": [
    { name: "Pão de Hambúrguer com Gergelim", qtyPerItem: 1, unit: "un" },
    { name: "Peito de Frango Empanado", qtyPerItem: 150, unit: "g" },
    { name: "Alface Americana", qtyPerItem: 30, unit: "g" },
    { name: "Molho Tártaro", qtyPerItem: 25, unit: "ml" }
  ],
  "Combo Smash + Batata + Refri": [
    { name: "Pão Brioche", qtyPerItem: 1, unit: "un" },
    { name: "Blend Bovino (Carne)", qtyPerItem: 180, unit: "g" },
    { name: "Queijo Cheddar", qtyPerItem: 2, unit: "fatias" },
    { name: "Batata Congelada", qtyPerItem: 180, unit: "g" },
    { name: "Refrigerante Lata", qtyPerItem: 1, unit: "lata" },
    { name: "Copo & Canudo Biodegradável", qtyPerItem: 1, unit: "un" }
  ],
  "Batata Frita Rústica (G)": [
    { name: "Batata Congelada", qtyPerItem: 300, unit: "g" },
    { name: "Óleo para Fritura", qtyPerItem: 50, unit: "ml" },
    { name: "Embalagem Batata", qtyPerItem: 1, unit: "un" }
  ]
};

import { ThemeToggle } from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

export default function RelatoriosPage() {
  const { tenantId } = useAuth();
  const [timeframe, setTimeframe] = useState<"hoje" | "mes" | "ano" | "todos">("hoje");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "orders"),
      where("tenant_id", "==", tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: OrderData[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as OrderData);
      });
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Filtragem por período
  const filteredOrders = orders.filter(order => {
    if (timeframe === "todos") return true;
    const orderDate = new Date(order.created_at);
    const now = new Date();

    if (timeframe === "hoje") {
      return orderDate.toDateString() === now.toDateString();
    }
    if (timeframe === "mes") {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (timeframe === "ano") {
      return orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Métricas agregadas
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const ticketMedio = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Agrupamento por produto vendido
  const productStats: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!productStats[item.name]) {
        productStats[item.name] = { count: 0, revenue: 0 };
      }
      productStats[item.name].count += item.quantity;
      productStats[item.name].revenue += item.quantity * (item.price || 0);
    });
  });

  const sortedProducts = Object.entries(productStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const totalItemsSold = sortedProducts.reduce((sum, p) => sum + p.count, 0);

  // Motor Preditivo: Cálculo de Insumos Necessários
  const projectedIngredients: Record<string, { qty: number; unit: string; primaryLanche: string }> = {};

  sortedProducts.forEach(prod => {
    const ingredients = INGREDIENT_MAP[prod.name] || [
      { name: `Insumo base (${prod.name})`, qtyPerItem: 1, unit: "un" }
    ];

    const projectedDemand = Math.ceil(Math.max(prod.count * 1.3, 5));

    ingredients.forEach(ing => {
      if (!projectedIngredients[ing.name]) {
        projectedIngredients[ing.name] = { 
          qty: 0, 
          unit: ing.unit,
          primaryLanche: prod.name
        };
      }
      projectedIngredients[ing.name].qty += ing.qtyPerItem * projectedDemand;
    });
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        
        {/* Header com Seletor de Período & Tema */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <BarChart3 size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Inteligência de Vendas & Compras Preditivas
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Monitore o ritmo do seu fast-food e antecipe a reposição de insumos com base na demanda.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtros de Período */}
            <div className="bg-card p-1 rounded-xl flex items-center border border-border">
              {[
                { id: "hoje", label: "Hoje (Dia)" },
                { id: "mes", label: "Este Mês" },
                { id: "ano", label: "Este Ano" },
                { id: "todos", label: "Histórico Total" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframe(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tab.id
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Faturamento</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loading ? "..." : `R$ ${totalRevenue.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 bg-primary/20 text-primary rounded-xl">
                <DollarSign size={22} />
              </div>
            </div>
            <p className="text-xs text-primary flex items-center gap-1 font-semibold">
              <TrendingUp size={13} />
              <span>Receita líquida no período</span>
            </p>
          </div>

          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pedidos Atendidos</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loading ? "..." : `${totalOrdersCount} Vendas`}
                </h3>
              </div>
              <div className="p-3 bg-accent/20 text-accent rounded-xl">
                <ShoppingCart size={22} />
              </div>
            </div>
            <p className="text-xs text-accent flex items-center gap-1 font-semibold">
              <CheckCircle2 size={13} />
              <span>Total de comandas geradas</span>
            </p>
          </div>

          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Ticket Médio</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loading ? "..." : `R$ ${ticketMedio.toFixed(2)}`}
                </h3>
              </div>
              <div className="p-3 bg-success/20 text-success rounded-xl">
                <TrendingUp size={22} />
              </div>
            </div>
            <p className="text-xs text-success flex items-center gap-1 font-semibold">
              <ArrowUpRight size={13} />
              <span>Gasto médio por cliente</span>
            </p>
          </div>

          <div className="glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Lanches Produzidos</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {loading ? "..." : `${totalItemsSold} Unidades`}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
                <Boxes size={22} />
              </div>
            </div>
            <p className="text-xs text-amber-500 flex items-center gap-1 font-semibold">
              <Sparkles size={13} />
              <span>Volume de saída da cozinha</span>
            </p>
          </div>
        </div>

        {/* SEÇÃO PRINCIPAL: ANÁLISE DE PRODUTOS + PREDIÇÃO DE INSUMOS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          
          {/* Lado Esquerdo: Ranking de Lanches Mais Vendidos */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <PieChart size={20} className="text-primary" />
                  Potencial de Venda por Lanche
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ranking dos itens mais pedidos no período selecionado.
                </p>
              </div>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Nenhum lanche vendido ainda no período selecionado.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProducts.map((prod, idx) => {
                  const percentage = totalItemsSold > 0 ? (prod.count / totalItemsSold) * 100 : 0;
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-black/10 dark:bg-white/10 text-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-foreground text-sm">{prod.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground text-sm">{prod.count} un</span>
                          <span className="text-xs text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>Receita gerada: <strong className="text-success">R$ {prod.revenue.toFixed(2)}</strong></span>
                        <span className="text-primary font-bold">Frequência Alta</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lado Direito: Sugestão Preditiva de Compras de Insumos */}
          <div className="glass rounded-2xl p-6 border border-border flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Sugestão Preditiva de Compras
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Projeção automática para antecipar compras antes do pico de vendas.
                </p>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-500 font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Truck size={13} /> Antecipação
              </span>
            </div>

            <div className="mb-4 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-foreground/90 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong>Inteligência de Estoque:</strong> Com base na saída diária de lanches, calculamos a quantidade exata de cada insumo (com margem de segurança de 30%) para você negociar com fornecedores antes do final de semana.
              </span>
            </div>

            {Object.keys(projectedIngredients).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Realize vendas no PDV para gerar projeções de compra.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase font-bold">
                      <th className="pb-3">Insumo / Ingrediente</th>
                      <th className="pb-3 text-center">Demanda Projetada</th>
                      <th className="pb-3 text-right">Ação Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(projectedIngredients).map(([name, data], idx) => {
                      let displayQty = data.qty;
                      let unit = data.unit;
                      if (unit === "g" && displayQty >= 1000) {
                        displayQty = +(displayQty / 1000).toFixed(2);
                        unit = "kg";
                      }
                      if (unit === "ml" && displayQty >= 1000) {
                        displayQty = +(displayQty / 1000).toFixed(2);
                        unit = "L";
                      }

                      return (
                        <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5">
                            <div className="font-bold text-foreground text-xs sm:text-sm">{name}</div>
                            <div className="text-[11px] text-muted-foreground">Usado em: {data.primaryLanche}</div>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs">
                              {displayQty} {unit}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/30">
                              <CheckCircle2 size={12} /> Garantir no Estoque
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}