"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Bell, 
  Search, 
  X,
  Sparkles
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { menuService } from "../../services/menuService";
import { orderService } from "../../services/orderService";
import { tableService } from "../../services/tableService";
import { MenuItem, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { ThemeToggle } from "../../components/common/ThemeToggle";

function CardapioContent() {
  const searchParams = useSearchParams();
  const [tenantId, setTenantId] = useState<string>("tenant-demo");
  const tableParam = searchParams.get("mesa") || "1";
  const tableNumber = parseInt(tableParam, 10) || 1;

  const [restaurantName, setRestaurantName] = useState("Restaurante & Bar");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number; notes: string }>>([]);
  const [showCart, setShowCart] = useState(false);
  const [clientName, setClientName] = useState("");
  const [orderSentNumber, setOrderSentNumber] = useState<number | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Detecta tenant por query param (?tenant=XYZ) ou por pathname (/cardapio/XYZ)
    const qTenant = searchParams.get("tenant");
    if (qTenant) {
      setTenantId(qTenant);
      return;
    }
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "cardapio") {
        setTenantId(parts[1]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!tenantId) return;

    // Busca nome e moeda do restaurante
    const loadTenant = async () => {
      try {
        const snap = await getDoc(doc(db, "tenants", tenantId));
        if (snap.exists()) {
          const d = snap.data();
          if (d.businessName) setRestaurantName(d.businessName);
          if (d.settings?.currency) setCurrency(d.settings.currency);
        }
      } catch (e) {
        console.warn("Tenant load fallback");
      }
    };
    loadTenant();

    // Escuta cardápio em tempo real
    const unsub = menuService.subscribeMenu(tenantId, (items) => {
      setMenuItems(items);
    });

    return () => unsub();
  }, [tenantId]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(p => p.item.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { item, quantity: 1, notes: "" }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === id) {
        const q = c.quantity + delta;
        return q > 0 ? { ...c, quantity: q } : null;
      }
      return c;
    }).filter(Boolean) as any);
  };

  const cartTotal = cart.reduce((s, c) => s + (c.item.price * c.quantity), 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handleSendOrder = async () => {
    if (cart.length === 0 || !tenantId) return;
    setSending(true);

    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);

      // 1. Cria o Pedido para a Cozinha
      await orderService.createOrder({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_name: clientName.trim() || `Mesa ${tableNumber}`,
        table_number: tableNumber,
        order_type: "qrcode_mesa",
        payment_method: "a_pagar",
        pacing_priority: "prioridade_salao",
        items: cart.map(c => ({
          name: c.item.name,
          category: c.item.category,
          quantity: c.quantity,
          price: c.item.price,
          notes: c.notes || ""
        })),
        total_price: cartTotal,
        status: "pendente",
        estimated_minutes: 10,
        created_at: new Date().toISOString()
      });

      // 2. Vincula à Comanda da Mesa
      await tableService.addItemsFromQrCode(
        tenantId,
        tableNumber,
        cart.map(c => ({
          id: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          category: c.item.category,
          notes: c.notes || "",
          sentToKitchen: true,
          addedAt: new Date().toISOString()
        })),
        clientName.trim()
      );

      setOrderSentNumber(orderNumber);
      setCart([]);
      setShowCart(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar pedido para a cozinha.");
    } finally {
      setSending(false);
    }
  };

  const handleCallWaiter = async () => {
    if (!tenantId) return;
    try {
      await tableService.callWaiter(tenantId, tableNumber);
      setWaiterCalled(true);
      setTimeout(() => setWaiterCalled(false), 8000);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ["todos", "entradas", "pratos", "bebidas", "sobremesas"];
  const filtered = menuItems.filter(m => {
    const matchesCat = activeCategory === "todos" || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Topo do Restaurante */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-20 backdrop-blur-md bg-card/95">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <h1 className="text-base font-black leading-tight">{restaurantName}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
                Mesa {tableNumber} • Cardápio Digital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCallWaiter}
              disabled={waiterCalled}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                waiterCalled 
                  ? "bg-destructive text-white animate-pulse" 
                  : "bg-card border border-border hover:border-primary text-foreground"
              }`}
            >
              <Bell size={14} className={waiterCalled ? "fill-white" : ""} />
              <span>{waiterCalled ? "Garçom Chamado!" : "Chamar Garçom"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Confirmação de Pedido Enviado */}
      {orderSentNumber && (
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-success/20 border border-success/40 text-success p-4 rounded-2xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-success" />
              <div>
                <h4 className="text-xs font-black">Pedido #{orderSentNumber} enviado para a cozinha!</h4>
                <p className="text-[11px] opacity-90">A equipe já começou a preparar. Relaxe e aproveite!</p>
              </div>
            </div>
            <button onClick={() => setOrderSentNumber(null)} className="text-xs font-bold underline">Fechar</button>
          </div>
        </div>
      )}

      {/* Busca e Categorias */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Buscar pratos, bebidas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === c 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de Produtos */}
      <main className="max-w-2xl mx-auto px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            Nenhum item disponível nesta categoria.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-2xl p-4 flex justify-between items-center gap-3 shadow-sm hover:border-primary/50 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-foreground">{item.name}</h3>
                  {item.popular && (
                    <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Sparkles size={9} /> Top
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                <div className="mt-2 text-sm font-black text-foreground">
                  {formatCurrency(item.price, currency)}
                </div>
              </div>

              <button
                onClick={() => addToCart(item)}
                className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          ))
        )}
      </main>

      {/* Barra Flutuante do Carrinho */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-black">{cartCount}</span>
              <span>Ver Comanda da Mesa</span>
            </div>
            <span className="text-sm font-black">{formatCurrency(cartTotal, currency)}</span>
          </button>
        </div>
      )}

      {/* Modal Carrinho */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <h3 className="text-base font-black">Seu Pedido na Mesa {tableNumber}</h3>
                <button onClick={() => setShowCart(false)} className="p-1 text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 mb-3 divide-y divide-border/60">
                {cart.map(c => (
                  <div key={c.item.id} className="pt-2 first:pt-0">
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold">{c.item.name}</span>
                      <span className="font-black text-success">{formatCurrency(c.item.price * c.quantity, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-border">
                        <button onClick={() => updateQty(c.item.id, -1)} className="p-1"><Minus size={12} /></button>
                        <span className="text-xs font-bold px-2">{c.quantity}</span>
                        <button onClick={() => updateQty(c.item.id, 1)} className="p-1"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => updateQty(c.item.id, -c.quantity)} className="text-destructive p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="font-bold text-muted-foreground uppercase">Total:</span>
                <span className="text-xl font-black">{formatCurrency(cartTotal, currency)}</span>
              </div>
              <button
                onClick={handleSendOrder}
                disabled={sending}
                className="w-full py-3.5 bg-primary text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                {sending ? "A enviar..." : "Confirmar e Enviar para a Cozinha 🍽️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardapioQrCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">A carregar cardápio...</div>}>
      <CardapioContent />
    </Suspense>
  );
}
