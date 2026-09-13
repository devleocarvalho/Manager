"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { SyncStatusBadge } from "../../components/SyncStatusBadge";
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Play, 
  Bell, 
  Zap,
  Sparkles,
  ArrowUpDown,
  Archive,
  Filter,
  Check
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { playNewOrderSound, playUrgentAlertSound } from "../../lib/sound";
import { isOrderFastTrack, calculateOrderEstimatedMinutes, ITEM_PREP_TIMES } from "../../lib/orderEstimator";
import { syncEngine } from "../../lib/syncEngine";

export interface OrderItem {
  name: string;
  category?: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  order_type: "local" | "viagem";
  payment_method?: string;
  items: OrderItem[];
  total_price: number;
  status: "pendente" | "preparando" | "pronto" | "entregue";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  delivered_at?: string;
  estimated_minutes?: number;
  is_fast_track?: boolean;
}

export default function CozinhaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"esteira" | "historico">("esteira");
  const [filterType, setFilterType] = useState<"todos" | "fasttrack" | "urgentes">("todos");
  const [sortBy, setSortBy] = useState<"fifo" | "fastest" | "estimated">("fifo");
  const [screenFlash, setScreenFlash] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const previousOrdersCountRef = useRef<number | null>(null);

  // Atualiza relógio a cada 4 segundos para recalcular tempos de espera e barras de progresso
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(timer);
  }, []);

  // Escuta os pedidos em tempo real (Firebase + Local Storage Híbrido)
  useEffect(() => {
    // 1. Carrega pedidos locais iniciais
    const localOrders = syncEngine.getLocalCollection("meugerente_local_orders");
    if (localOrders.length > 0) {
      setOrders(localOrders);
      setLoading(false);
    }

    // 2. Listener do Firebase Firestore
    const q = query(
      collection(db, "orders"),
      where("tenant_id", "==", "tenant-demo")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const items = data.items || [];
        const isFast = isOrderFastTrack(items);
        const estMin = data.estimated_minutes || calculateOrderEstimatedMinutes(items, 0);

        ordersData.push({
          id: docSnap.id,
          ...data,
          is_fast_track: isFast,
          estimated_minutes: estMin
        } as Order);
      });

      const currentPendingCount = ordersData.filter(o => o.status === "pendente").length;
      if (previousOrdersCountRef.current !== null && currentPendingCount > previousOrdersCountRef.current) {
        if (audioEnabled) {
          playNewOrderSound();
        }
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 2400);
      }
      previousOrdersCountRef.current = currentPendingCount;

      setOrders(ordersData);
      setLoading(false);
    });

    // 3. Listener de Eventos Locais (Sem Internet)
    const handleLocalEvent = (e: any) => {
      const { type, payload } = e.detail || {};
      if (type === "NEW_ORDER" && payload) {
        const isFast = isOrderFastTrack(payload.items || []);
        const estMin = payload.estimated_minutes || calculateOrderEstimatedMinutes(payload.items || [], 0);
        const newOrder: Order = {
          ...payload,
          is_fast_track: isFast,
          estimated_minutes: estMin
        };

        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });

        if (audioEnabled) playNewOrderSound();
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 2400);
      }

      if (type === "ORDER_STATUS_CHANGED" && payload?.orderId) {
        setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
      }
    };
    window.addEventListener("meugerente_local_event", handleLocalEvent);

    return () => {
      unsubscribe();
      window.removeEventListener("meugerente_local_event", handleLocalEvent);
    };
  }, [audioEnabled]);

  // Mudança de status do pedido na esteira híbrida
  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const updateData: any = {};
      if (newStatus === "preparando") {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === "pronto") {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === "entregue") {
        updateData.delivered_at = new Date().toISOString();
      }

      // Atualiza localmente de imediato no state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...updateData } : o));

      // Dispara atualização híbrida (Local Broadcast + Firestore)
      await syncEngine.updateOrderStatus(orderId, newStatus, updateData);
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
    }
  };

  // Cálculo de tempo decorrido em minutos
  const getElapsedMinutes = (dateString: string) => {
    const diffMs = now - new Date(dateString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Ordenação flexível (Permite fluxo não-cronológico com Fast-Track)
  const sortOrders = (list: Order[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === "fastest") {
        // Fast-Track primeiro
        if (a.is_fast_track && !b.is_fast_track) return -1;
        if (!a.is_fast_track && b.is_fast_track) return 1;
        return (a.estimated_minutes || 5) - (b.estimated_minutes || 5);
      }
      if (sortBy === "estimated") {
        return (a.estimated_minutes || 5) - (b.estimated_minutes || 5);
      }
      // FIFO Padrão
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  // Filtragem
  const applyFilter = (list: Order[]) => {
    if (filterType === "fasttrack") return list.filter(o => o.is_fast_track);
    if (filterType === "urgentes") {
      return list.filter(o => {
        const elapsed = getElapsedMinutes(o.created_at);
        const est = o.estimated_minutes || 8;
        return elapsed >= est;
      });
    }
    return list;
  };

  const pendentes = applyFilter(sortOrders(orders.filter(o => o.status === "pendente")));
  const preparando = applyFilter(sortOrders(orders.filter(o => o.status === "preparando")));
  const prontos = orders.filter(o => o.status === "pronto");
  const entregues = orders.filter(o => o.status === "entregue").reverse();

  return (
    <div className={`min-h-screen bg-background text-foreground flex transition-all ${screenFlash ? 'flash-screen' : ''}`}>
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col">
        {/* Header do KDS */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <ChefHat size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                  KDS Fast-Food Orquestra
                  {screenFlash && (
                    <span className="text-xs bg-primary text-white font-bold px-2.5 py-1 rounded-full animate-bounce">
                      NOVO PEDIDO!
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Esteira inteligente não-cronológica com previsão de tempo e fast-track.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SyncStatusBadge />

            {/* Filtros da Esteira */}
            <div className="bg-card p-1 rounded-xl flex items-center border border-border">
              {[
                { id: "todos", label: "Todos" },
                { id: "fasttrack", label: "⚡ Fast-Track" },
                { id: "urgentes", label: "🚨 No Limite" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === f.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1 text-xs">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer py-1"
              >
                <option value="fifo" className="bg-card text-foreground">Ordem de Chegada (FIFO)</option>
                <option value="fastest" className="bg-card text-foreground">Mais Rápidos Primeiro ⚡</option>
                <option value="estimated" className="bg-card text-foreground">Menor Tempo Estimado</option>
              </select>
            </div>

            {/* Botão de Som */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) playNewOrderSound();
              }}
              title={audioEnabled ? "Alertas sonoros ativados" : "Alertas sonoros silenciados"}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled 
                  ? "bg-primary/20 text-primary border-primary/40 shadow-sm" 
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Toggle de Tema */}
            <ThemeToggle />
          </div>
        </header>

        {/* Indicadores do KDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-panel p-4 flex items-center justify-between border-amber-500/30 bg-amber-500/5">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-500 font-bold">1. Fila de Espera</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{pendentes.length} Pedidos</h3>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
              <Clock size={22} />
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center justify-between border-accent/30 bg-accent/5">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold">2. Na Chapa / Montagem</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{preparando.length} em Produção</h3>
            </div>
            <div className="p-3 bg-accent/20 text-accent rounded-xl">
              <Flame size={22} />
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center justify-between border-success/30 bg-success/5">
            <div>
              <p className="text-xs uppercase tracking-wider text-success font-bold">3. Pronto no Balcão</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{prontos.length} Aguardando Retirada</h3>
            </div>
            <div className="p-3 bg-success/20 text-success rounded-xl">
              <Bell size={22} />
            </div>
          </div>
        </div>

        {/* ESTEIRA KANBAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
          
          {/* COLUNA 1: FILA DE ESPERA */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                Fila de Espera ({pendentes.length})
              </span>
              <span className="text-xs text-muted-foreground">Clique para iniciar</span>
            </div>

            {pendentes.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm border-dashed border-border">
                Nenhum pedido na fila. Tudo limpo!
              </div>
            ) : (
              pendentes.map((order) => {
                const elapsed = getElapsedMinutes(order.created_at);
                const estMin = order.estimated_minutes || 6;
                const isOverdue = elapsed >= estMin;
                const progressPct = Math.min(100, Math.round((elapsed / estMin) * 100));

                return (
                  <div 
                    key={order.id}
                    className={`glass rounded-2xl p-5 border transition-all shadow-lg ${
                      isOverdue 
                        ? "pulse-urgent border-destructive shadow-destructive/20" 
                        : order.is_fast_track 
                          ? "border-amber-400/50 bg-amber-400/5" 
                          : "border-border"
                    }`}
                  >
                    {/* Topo do Card */}
                    <div className="flex justify-between items-start pb-3 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-foreground">#{order.order_number}</span>
                          
                          {/* Badge Fast-Track */}
                          {order.is_fast_track ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase bg-amber-400 text-black flex items-center gap-1 shadow-sm">
                              <Zap size={11} className="fill-black" /> Fast-Track
                            </span>
                          ) : (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.order_type === 'viagem' 
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                                : 'bg-primary/20 text-primary border border-primary/30'
                            }`}>
                              {order.order_type === 'viagem' ? '🛍️ Viagem' : '🍔 Salão'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                          Cliente: <span className="text-foreground font-semibold">{order.customer_name}</span>
                        </p>
                      </div>

                      {/* Tempo Decorrido & Estimativa */}
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                          isOverdue 
                            ? 'bg-destructive text-white animate-bounce' 
                            : 'bg-black/10 dark:bg-white/10 text-foreground'
                        }`}>
                          <Clock size={13} />
                          {elapsed} / ~{estMin} min
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso de Tempo Estimado */}
                    <div className="mt-3">
                      <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isOverdue ? 'bg-destructive' : progressPct > 70 ? 'bg-amber-400' : 'bg-primary'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista de Itens do Pedido */}
                    <div className="py-4 space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">
                              <span className="text-primary font-black text-base mr-1.5">{item.quantity}x</span>
                              {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded mt-1.5 flex items-center gap-1 border border-amber-500/20">
                              <AlertCircle size={12} />
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botão: Iniciar Preparo (Não-cronológico: pode começar qualquer um!) */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, "preparando")}
                      className="w-full py-3 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition-all text-sm active:scale-95"
                    >
                      <Play size={16} /> Iniciar Preparo na Chapa
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* COLUNA 2: EM PREPARO */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent animate-ping"></span>
                Na Chapa / Montagem ({preparando.length})
              </span>
              <span className="text-xs text-muted-foreground">Em execução</span>
            </div>

            {preparando.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm border-dashed border-border">
                Nenhum lanche sendo montado no momento.
              </div>
            ) : (
              preparando.map((order) => {
                const elapsed = getElapsedMinutes(order.started_at || order.created_at);
                const estMin = order.estimated_minutes || 6;
                const isOverdue = elapsed >= estMin;

                return (
                  <div 
                    key={order.id}
                    className={`glass rounded-2xl p-5 border shadow-xl transition-all ${
                      isOverdue 
                        ? 'border-destructive bg-destructive/5' 
                        : 'border-accent/50 bg-accent/5'
                    }`}
                  >
                    {/* Topo do Card */}
                    <div className="flex justify-between items-start pb-3 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-foreground">#{order.order_number}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase bg-accent text-white flex items-center gap-1 shadow-sm">
                            <Flame size={12} /> Preparando
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                          Cliente: <span className="text-foreground font-semibold">{order.customer_name}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg bg-accent text-white">
                        <Flame size={13} />
                        {elapsed} min
                      </div>
                    </div>

                    {/* Lista de Itens */}
                    <div className="py-4 space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">
                              <span className="text-accent font-black text-base mr-1.5">{item.quantity}x</span>
                              {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded mt-1.5 flex items-center gap-1 border border-amber-500/20">
                              <AlertCircle size={12} />
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botão: Finalizar e Chamar Caixa */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, "pronto")}
                      className="w-full py-3 bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-success/25 transition-all text-sm active:scale-95"
                    >
                      <Bell size={16} /> Lanche Pronto! Chamar Balcão 🔔
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* COLUNA 3: PRONTO PARA RETIRADA */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="font-bold text-foreground text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                Balcão de Retirada ({prontos.length})
              </span>
              <span className="text-xs text-muted-foreground">Pronto para entrega</span>
            </div>

            {prontos.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm border-dashed border-border">
                Nenhum pedido aguardando no balcão.
              </div>
            ) : (
              prontos.map((order) => (
                <div 
                  key={order.id}
                  className="glass rounded-2xl p-5 border border-success/50 bg-success/5 shadow-xl transition-all ready-bounce"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-success">#{order.order_number}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase bg-success text-white">
                          PRONTO
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        Chamar: <span className="text-foreground font-bold text-sm">{order.customer_name}</span>
                      </p>
                    </div>

                    <div className="p-2.5 bg-success/20 text-success rounded-xl">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>

                  <div className="py-3 space-y-1 text-xs text-foreground">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="truncate font-medium">
                        <span className="font-bold text-success mr-1">{item.quantity}x</span> {item.name}
                      </p>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "entregue")}
                    className="w-full py-2.5 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs hover:opacity-90 active:scale-95"
                  >
                    <Check size={16} /> Confirmar Entrega ao Cliente
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}