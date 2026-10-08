"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { db } from "../../../lib/firebase";
import { menuService } from "../../../services/menuService";
import { orderService } from "../../../services/orderService";
import { tableService } from "../../../services/tableService";
import { MenuItem, CurrencyCode } from "../../../domain/types";
import { formatCurrency } from "../../../lib/currency";
import { ThemeToggle } from "../../../components/common/ThemeToggle";

export default function CardapioQrCodePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantId = (params?.tenantId as string) || "tenant-demo";
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

    // Escuta cardápio
    const unsub = menuService.subscribeMenu(tenantId, setMenuItems);
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

  const handleCallWaiter = async () => {
    setWaiterCalled(true);
    await tableService.callWaiter(tenantId, tableNumber);
    alert(`🔔 Garçom chamado para a Mesa ${tableNumber}!`);
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);

    try {
      const orderNum = Math.floor(100 + Math.random() * 900);
      const total = cart.reduce((s, c) => s + (c.item.price * c.quantity), 0);

      // Cria na Cozinha
      await orderService.createOrder({
        tenant_id: tenantId,
        order_number: orderNum,
        customer_name: `Mesa ${tableNumber < 10 ? '0' + tableNumber : tableNumber}${clientName ? ' (' + clientName.trim() + ')' : ''}`,
        table_number: tableNumber,
        order_type: "qrcode_mesa",
        payment_method: "comanda_mesa",
        items: cart.map(c => ({
          name: c.item.name,
          category: c.item.category,
          quantity: c.quantity,
          price: c.item.price,
          notes: c.notes || ""
        })),
        total_price: total,
        status: "pendente",
        estimated_minutes: 10,
        created_at: new Date().toISOString()
      });

      // Lança na Mesa
      const tableId = `${tenantId}_mesa-${tableNumber}`;
      const snap = await getDoc(doc(db, "tables", tableId));
      const currentItems = snap.exists() ? (snap.data().items || []) : [];
      const newItems = cart.map(c => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        category: c.item.category,
        notes: c.notes,
        sentToKitchen: true,
        addedAt: new Date().toISOString(),
        vatRate: c.item.vatRate || 13
      }));

      const merged = [...currentItems, ...newItems];
      const newTotal = merged.reduce((s, i) => s + (i.price * i.quantity), 0);
      await updateDoc(doc(db, "tables", tableId), {
        status: "ocupada",
        customerName: clientName.trim() || `Cliente QR Mesa ${tableNumber}`,
        items: merged,
        totalAmount: newTotal
      });

      setOrderSentNumber(orderNum);
      setCart([]);
      setShowCart(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar pedido.");
    } finally {
      setSending(false);
    }
  };

  const categories = ["todos", "entradas", "pratos", "bebidas", "sobremesas"];
  const filtered = menuItems.filter(m => {
    const matchesCat = activeCategory === "todos" || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((s, c) => s + (c.item.price * c.quantity), 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto shadow-2xl pb-24">
      {/* Topo */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-primary/20 text-primary">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-foreground leading-none">{restaurantName}</h1>
              <span className="text-[11px] text-muted-foreground">Cardápio Digital Oficial</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl p-2.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-primary text-white px-2.5 py-1 rounded-xl">
              Mesa {tableNumber < 10 ? '0' + tableNumber : tableNumber}
            </span>
            <span className="text-xs font-semibold">Pedido direto da mesa</span>
          </div>
          <button
            onClick={handleCallWaiter}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
              waiterCalled ? "bg-destructive text-white animate-pulse" : "bg-card border border-border"
            }`}
          >
            <Bell size={12} /> {waiterCalled ? "Chamado!" : "Chamar"}
          </button>
        </div>
      </header>

      {/* Sucesso */}
      {orderSentNumber && (
        <div className="m-4 p-4 rounded-3xl bg-success/20 border-2 border-success text-foreground animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-success text-white rounded-xl">
              <Check size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm">Pedido #{orderSentNumber} Enviado!</h3>
              <p className="text-xs text-muted-foreground mt-0.5">A cozinha já está a preparar os seus pratos.</p>
            </div>
          </div>
          <button onClick={() => setOrderSentNumber(null)} className="w-full mt-3 py-2 bg-success text-white font-bold rounded-xl text-xs">
            Fazer outro pedido
          </button>
        </div>
      )}

      {/* Catálogo */}
      <main className="p-4 flex-1">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="O que deseja pedir hoje?..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap ${
                activeCategory === c ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm">{item.name}</h3>
                    {item.popular && (
                      <span className="text-[10px] font-black uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  {item.allergens && item.allergens.length > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Alérgenos: {item.allergens.join(", ")}
                    </span>
                  )}
                </div>
                <span className="text-base font-black text-success">{formatCurrency(item.price, currency)}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1 active:scale-95"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Barra de Carrinho */}
      {cartCount > 0 && (
        <div className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-primary to-accent text-white rounded-3xl font-black text-xs flex items-center justify-between shadow-2xl active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>Ver Pedido ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
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
