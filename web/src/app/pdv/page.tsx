"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { SyncStatusBadge } from "../../components/SyncStatusBadge";
import { 
  ShoppingCart, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Utensils, 
  Flame, 
  Coffee, 
  Sparkles, 
  User, 
  CreditCard, 
  QrCode, 
  Banknote,
  Search,
  Tag,
  Bell,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  Check,
  UtensilsCrossed
} from "lucide-react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { processSaleDeduction } from "../../lib/stockManager";
import { playOrderReadySound } from "../../lib/sound";
import { syncEngine } from "../../lib/syncEngine";
import { 
  calculateOrderEstimatedMinutes, 
  isOrderFastTrack, 
  ITEM_PREP_TIMES 
} from "../../lib/orderEstimator";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
  id: string;
  name: string;
  category: "lanches" | "combos" | "bebidas" | "porcoes" | "sobremesas";
  price: number;
  description: string;
  popular?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface ReadyOrder {
  id: string;
  order_number: number;
  customer_name: string;
  total_price: number;
  items: Array<{ name: string; quantity: number }>;
}

const DEFAULT_MENU: MenuItem[] = [
  { id: "1", name: "Smash Burger Duplo", category: "lanches", price: 28.90, description: "2x carnes 90g, queijo cheddar derretido e molho da casa.", popular: true },
  { id: "2", name: "Mega Bacon Crispy", category: "lanches", price: 34.50, description: "Pão brioche, 160g blend bovino, muito bacon e maionese defumada.", popular: true },
  { id: "3", name: "Cheese Chicken Salada", category: "lanches", price: 26.00, description: "Frango empanado super crocante, alface americana e molho tártaro." },
  { id: "4", name: "Combo Smash + Batata + Refri", category: "combos", price: 42.90, description: "Smash duplo + Batata rústica P + Lata 350ml.", popular: true },
  { id: "5", name: "Combo Mega Bacon Completo", category: "combos", price: 49.90, description: "Mega Bacon + Batata com Cheddar & Bacon + Milkshake." },
  { id: "6", name: "Batata Frita Rústica (G)", category: "porcoes", price: 18.00, description: "Crocantes por fora, macias por dentro, com páprica doce." },
  { id: "7", name: "Nuggets Crocantes (10 un)", category: "porcoes", price: 20.00, description: "Acompanha molho barbecue e maionese verde artesanal." },
  { id: "8", name: "Refrigerante Lata 350ml", category: "bebidas", price: 6.50, description: "Coca-Cola, Guaraná, Sprite ou Fanta." },
  { id: "9", name: "Suco Natural de Laranja 500ml", category: "bebidas", price: 9.00, description: "100% fruta espremida na hora." },
  { id: "10", name: "Milkshake de Chocolate Belga", category: "sobremesas", price: 16.00, description: "Batido com sorvete artesanal e calda quente.", popular: true },
];

export default function PdvPage() {
  const { tenantId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<"local" | "viagem">("local");
  const [destinationType, setDestinationType] = useState<"balcao" | "mesa">("balcao");
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Estados de Fila e Pedidos Prontos da Cozinha (Real-Time)
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const previousReadyCountRef = useRef<number | null>(null);

  // Composições dinâmicas das Fichas Técnicas e Lista de Mesas
  const [customMenu, setCustomMenu] = useState<MenuItem[]>([]);
  const [tablesList, setTablesList] = useState<Array<{ id: string; number: number; name: string; status: string }>>([]);

  // Escuta a fila da Cozinha, Fichas Técnicas e Mesas em tempo real
  useEffect(() => {
    if (!tenantId) return;

    // 1. Cozinha / Pedidos
    const q = query(
      collection(db, "orders"),
      where("tenant_id", "==", tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let pendingCount = 0;
      const readyList: ReadyOrder[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === "pendente" || data.status === "preparando") {
          pendingCount += 1;
        }
        if (data.status === "pronto") {
          readyList.push({
            id: docSnap.id,
            order_number: data.order_number,
            customer_name: data.customer_name,
            total_price: data.total_price,
            items: data.items || []
          });
        }
      });

      if (previousReadyCountRef.current !== null && readyList.length > previousReadyCountRef.current) {
        if (audioEnabled) {
          playOrderReadySound();
        }
      }
      previousReadyCountRef.current = readyList.length;

      setPendingQueueCount(pendingCount);
      setReadyOrders(readyList);
    });

    // 2. Fichas Técnicas (Composições cadastradas pelo dono)
    const qSheets = query(
      collection(db, "technical_sheets"),
      where("tenant_id", "==", tenantId)
    );
    const unsubSheets = onSnapshot(qSheets, (snapshot) => {
      const sheets: MenuItem[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: `sheet-${d.id}`,
          name: data.menuItemName,
          category: data.category || "lanches",
          price: Number(data.salePrice) || 28.00,
          description: `Composição: ${data.items?.length || 0} insumos vinculados ao estoque.`,
          popular: true
        };
      });
      setCustomMenu(sheets);
    });

    // 3. Mesas
    const qTables = query(
      collection(db, "tables"),
      where("tenant_id", "==", tenantId)
    );
    const unsubTables = onSnapshot(qTables, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        number: d.data().number,
        name: d.data().name,
        status: d.data().status
      }));
      list.sort((a, b) => a.number - b.number);
      setTablesList(list);
    });

    // 4. Listener de Eventos Locais (Sem Internet)
    const handleLocalEvent = (e: any) => {
      const { type, payload } = e.detail || {};
      if (type === "ORDER_STATUS_CHANGED" && payload?.status === "pronto") {
        if (audioEnabled) playOrderReadySound();
      }
    };
    window.addEventListener("meugerente_local_event", handleLocalEvent);

    return () => {
      unsubscribe();
      unsubSheets();
      unsubTables();
      window.removeEventListener("meugerente_local_event", handleLocalEvent);
    };
  }, [audioEnabled]);

  // Cardápio Unificado (Fichas Técnicas cadastradas têm prioridade sobre itens padrão)
  const unifiedMenu = [
    ...customMenu,
    ...DEFAULT_MENU.filter(d => !customMenu.some(c => c.name.toLowerCase().trim() === d.name.toLowerCase().trim()))
  ];

  // Filtro de catálogo
  const filteredMenu = unifiedMenu.filter(item => {
    const matchesCategory = selectedCategory === "todos" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await syncEngine.updateOrderStatus(orderId, "entregue", { delivered_at: new Date().toISOString() });
    } catch (e) {
      console.error(e);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const estimatedPrepMinutes = calculateOrderEstimatedMinutes(
    cart.map(c => ({ name: c.name, quantity: c.quantity })),
    pendingQueueCount
  );
  const isFast = isOrderFastTrack(cart.map(c => ({ name: c.name, quantity: c.quantity })));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setAlerts([]);
    setSuccessOrder(null);

    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);
      const allAlerts: string[] = [];

      // Identificação final do cliente/mesa
      let finalCustomerName = customerName.trim() || "Balcão";
      if (destinationType === "mesa") {
        const tNum = selectedTableNumber < 10 ? `0${selectedTableNumber}` : `${selectedTableNumber}`;
        finalCustomerName = `Mesa ${tNum}${customerName ? ' (' + customerName.trim() + ')' : ''}`;
      }

      // 1. Baixa FEFO no estoque
      try {
        for (const item of cart) {
          const resultAlerts = await processSaleDeduction(tenantId, item.name, item.quantity);
          allAlerts.push(...resultAlerts);
        }
      } catch (err) {
        console.warn("Dedução online falhou, continuando offline:", err);
      }

      // 2. Transação Financeira Híbrida
      await syncEngine.addTransaction({
        tenant_id: tenantId,
        type: "income",
        category: "sales",
        amount: cartTotal,
        description: `Venda Pedido #${orderNumber} (${orderType === 'local' ? 'Salão' : 'Viagem'}) - ${finalCustomerName}`,
        date: new Date().toISOString()
      });

      // 3. Salvar Pedido Híbrido (Local + Nuvem) para a Cozinha
      await syncEngine.createOrder({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_name: finalCustomerName,
        order_type: orderType,
        payment_method: paymentMethod,
        items: cart.map(i => ({
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes || ""
        })),
        total_price: cartTotal,
        status: "pendente",
        estimated_minutes: estimatedPrepMinutes,
        is_fast_track: isFast,
        created_at: new Date().toISOString()
      });

      // 4. Se vinculado a uma mesa fixa, sincroniza com o módulo de mesas
      if (destinationType === "mesa") {
        try {
          const tableId = `${tenantId}_mesa-${selectedTableNumber}`;
          const existingTable = tablesList.find(t => t.number === selectedTableNumber);
          const newItems = cart.map(i => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            category: i.category,
            notes: i.notes || "",
            sentToKitchen: true,
            addedAt: new Date().toISOString()
          }));
          const currentItems = (existingTable as any)?.items || [];
          const updatedTableItems = [...currentItems, ...newItems];
          const newTotal = updatedTableItems.reduce((s: number, it: any) => s + (it.price * it.quantity), 0);

          await updateDoc(doc(db, "tables", tableId), {
            status: "ocupada",
            customerName: customerName.trim() || "Cliente Salão",
            items: updatedTableItems,
            totalAmount: newTotal
          });
        } catch (err) {
          console.warn("Erro ao vincular mesa:", err);
        }
      }

      setSuccessOrder(`Pedido #${orderNumber} despachado! Previsão: ~${estimatedPrepMinutes} min.`);
      setAlerts(allAlerts);
      
      setCart([]);
      setCustomerName("");
    } catch (error) {
      console.error(error);
      setAlerts(["Erro ao processar venda."]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col gap-6">
        
        {/* Header Superior com Status da Cozinha & Tema */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <ShoppingCart size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  PDV Express & Frente de Loja
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Lançamento de comandas com previsão inteligente e aviso sonoro de lanche pronto.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <SyncStatusBadge />

            {/* Indicador de Gargalo da Cozinha */}
            <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${pendingQueueCount > 4 ? 'bg-destructive animate-ping' : pendingQueueCount > 1 ? 'bg-amber-400' : 'bg-success'}`} />
              <span>Cozinha: <strong className="text-foreground">{pendingQueueCount} na esteira</strong></span>
            </div>

            {/* Controle de Som */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) playOrderReadySound();
              }}
              title={audioEnabled ? "Som do Sino de Balcão Ativado" : "Silenciado"}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled 
                  ? "bg-primary/20 text-primary border-primary/40 shadow-sm" 
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Alternador de Tema Dia/Noite */}
            <ThemeToggle />
          </div>
        </header>

        {/* BANNER CHAMATIVO: PEDIDOS PRONTOS NO BALCÃO (Aviso em Tempo Real para o Operador) */}
        {readyOrders.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-success/20 via-emerald-500/15 to-success/20 border-2 border-success rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success text-white rounded-xl bell-ring-active">
                <Bell size={24} />
              </div>
              <div>
                <h4 className="font-black text-foreground text-base sm:text-lg flex items-center gap-2">
                  🔔 {readyOrders.length} {readyOrders.length === 1 ? 'Pedido Pronto no Balcão!' : 'Pedidos Prontos para Entrega!'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  A cozinha finalizou o preparo. Chame o cliente para retirar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {readyOrders.map(ro => (
                <div key={ro.id} className="flex items-center gap-2 bg-background/80 backdrop-blur-md border border-success/40 px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-black text-success text-sm">#{ro.order_number}</span>
                  <span className="font-bold text-foreground truncate max-w-[100px]">{ro.customer_name}</span>
                  <button
                    onClick={() => handleMarkDelivered(ro.id)}
                    className="p-1 hover:bg-success hover:text-white rounded-lg text-success transition-all"
                    title="Confirmar Entrega"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ÁREA PRINCIPAL: CATÁLOGO + CARRINHO */}
        <div className="flex-1 flex flex-col xl:flex-row gap-6">
          
          {/* LADO ESQUERDO: CATÁLOGO */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Barra de Busca e Categorias */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar lanche, combo, bebida..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-sm transition-all text-sm"
                />
              </div>

              {/* Categorias */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "todos", label: "Todos", icon: Utensils },
                  { id: "combos", label: "Combos", icon: Sparkles },
                  { id: "lanches", label: "Burgers", icon: Flame },
                  { id: "porcoes", label: "Porções", icon: Tag },
                  { id: "bebidas", label: "Bebidas", icon: Coffee },
                  { id: "sobremesas", label: "Sobremesas", icon: Sparkles },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-card text-muted-foreground border border-border hover:text-foreground"
                    }`}
                  >
                    <cat.icon size={14} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filteredMenu.map(item => {
                const prepInfo = ITEM_PREP_TIMES[item.name];
                const baseMin = prepInfo ? prepInfo.basePrepMinutes : 6;
                const isFastItem = prepInfo ? prepInfo.isFastItem : false;

                return (
                  <div 
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="glass-panel cursor-pointer hover:border-primary/60 transition-all group flex flex-col justify-between p-5 relative overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      {isFastItem ? (
                        <span className="bg-amber-400/20 text-amber-500 text-[11px] px-2 py-0.5 rounded-full font-bold border border-amber-400/30 flex items-center gap-1">
                          <Zap size={11} className="fill-amber-500" /> Rápido (~{baseMin}m)
                        </span>
                      ) : (
                        <span className="bg-black/5 dark:bg-white/5 text-muted-foreground text-[11px] px-2 py-0.5 rounded-full font-semibold border border-border flex items-center gap-1">
                          <Clock size={11} /> ~{baseMin} min
                        </span>
                      )}

                      {item.popular && (
                        <span className="bg-primary/20 text-primary text-[11px] px-2 py-0.5 rounded-full font-bold border border-primary/30 flex items-center gap-1">
                          <Sparkles size={11} /> Top 1
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-1 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <span className="text-lg font-black text-success">
                        R$ {item.price.toFixed(2)}
                      </span>
                      <button 
                        type="button" 
                        className="p-2 rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LADO DIREITO: CARRINHO */}
          <div className="w-full xl:w-96 glass rounded-2xl p-6 border border-border flex flex-col h-fit sticky top-6 shadow-xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                Comanda Atual
              </h3>
              <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-bold">
                {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Estimativa de Tempo de Espera para o Pedido Atual */}
            {cart.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className={isFast ? "text-amber-400" : "text-primary"} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Previsão para este pedido:
                  </span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  isFast ? 'bg-amber-400/20 text-amber-500' : 'bg-primary/20 text-primary'
                }`}>
                  ~{estimatedPrepMinutes} min {isFast ? '⚡' : ''}
                </span>
              </div>
            )}

            {/* Destino: Balcão ou Mesa Fixa */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">Destino do Atendimento</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationType("balcao");
                      setOrderType("local");
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      destinationType === "balcao" 
                        ? "bg-primary text-white border-primary shadow-sm" 
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShoppingCart size={13} /> Balcão / Retirada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationType("mesa");
                      setOrderType("local");
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      destinationType === "mesa" 
                        ? "bg-primary text-white border-primary shadow-sm" 
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UtensilsCrossed size={13} /> Mesa Fixa
                  </button>
                </div>

                {destinationType === "mesa" && (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 mb-2 animate-in fade-in duration-200">
                    <label className="block text-[10px] font-bold text-primary uppercase mb-1">Selecione a Mesa</label>
                    <select
                      value={selectedTableNumber}
                      onChange={e => setSelectedTableNumber(Number(e.target.value))}
                      className="w-full bg-card border border-border rounded-lg p-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                    >
                      {(tablesList.length > 0 ? tablesList : Array.from({ length: 10 }, (_, i) => ({ number: i + 1, name: `Mesa ${i < 9 ? '0' + (i+1) : i+1}`, status: "livre" }))).map(t => (
                        <option key={t.number} value={t.number}>
                          {t.name} {t.status === "ocupada" ? " (Ocupada)" : " (Livre)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {destinationType === "mesa" ? "Nome do Cliente na Mesa (Opcional)" : "Nome do Cliente"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
                  <input 
                    type="text" 
                    placeholder={destinationType === "mesa" ? "Ex: Família Silva" : "Ex: Carlos Balcão"} 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {destinationType === "balcao" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("local")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orderType === "local" 
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/25" 
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    🍔 Comer no Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("viagem")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orderType === "viagem" 
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/25" 
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    🛍️ Para Viagem
                  </button>
                </div>
              )}
            </div>

            {/* Lista do Carrinho */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-4 divide-y divide-border">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs leading-relaxed">
                  <Utensils className="mx-auto mb-2 opacity-40" size={28} />
                  Comanda vazia.<br />Clique nos lanches para montar o pedido.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="pt-3 first:pt-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-foreground">{item.name}</span>
                      <span className="font-black text-xs text-success">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <input 
                      type="text" 
                      placeholder="Obs: Sem cebola, bem passado..." 
                      value={item.notes || ""}
                      onChange={e => updateNotes(item.id, e.target.value)}
                      className="w-full mt-1.5 bg-card border border-border rounded-lg px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-card rounded-lg p-1 border border-border">
                        <button 
                          type="button" 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold text-foreground px-2">{item.quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => removeItem(item.id)}
                        className="text-destructive/70 hover:text-destructive p-1 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagamento */}
            {cart.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border mb-4">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pix", label: "Pix", icon: QrCode },
                    { id: "cartao", label: "Cartão", icon: CreditCard },
                    { id: "dinheiro", label: "Dinheiro", icon: Banknote },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentMethod(p.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] gap-1 transition-all ${
                        paymentMethod === p.id 
                          ? "bg-primary text-white border-primary font-bold shadow-sm" 
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p.icon size={15} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total e Botão */}
            <div className="pt-3 border-t border-border mt-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-muted-foreground text-xs font-bold uppercase">Total a Cobrar:</span>
                <span className="text-2xl font-black text-foreground">R$ {cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                type="button"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
              >
                {loading ? (
                  "Enviando para Cozinha..."
                ) : (
                  <>
                    <Send size={16} />
                    Despachar para a Cozinha
                  </>
                )}
              </button>
            </div>

            {/* Sucesso e Alertas */}
            {successOrder && (
              <div className="mt-4 p-3 bg-success/20 border border-success/40 rounded-xl text-success flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} />
                {successOrder}
              </div>
            )}

            {alerts.length > 0 && (
              <div className="mt-3 space-y-1">
                {alerts.map((al, idx) => (
                  <div key={idx} className="p-2 bg-card border border-border rounded-lg text-[11px] text-muted-foreground">
                    {al}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

