"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { menuService } from "../../services/menuService";
import { orderService } from "../../services/orderService";
import { financeService } from "../../services/financeService";
import { stockService } from "../../services/stockService";
import { MenuItem } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Search, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2 
} from "lucide-react";

export default function PdvPage() {
  const { tenantId, currency } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number; notes: string }>>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cartao" | "dinheiro" | "digital">("cartao");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!tenantId) return;
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

  const cartTotal = cart.reduce((s, c) => s + (c.item.price * c.quantity), 0);
  const change = paymentMethod === "dinheiro" && Number(amountReceived) > cartTotal 
    ? Number(amountReceived) - cartTotal 
    : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setSuccessMsg("");

    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);

      // 1. Registra no Financeiro
      await financeService.addTransaction({
        tenant_id: tenantId,
        type: "income",
        category: "sales",
        amount: cartTotal,
        description: `Venda Balcão #${orderNumber} - ${customerName.trim() || 'Balcão'} (${paymentMethod.toUpperCase()})`,
        payment_method: paymentMethod,
        date: new Date().toISOString()
      });

      // 2. Envia para a Cozinha
      await orderService.createOrder({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_name: customerName.trim() || "Balcão",
        order_type: "local",
        payment_method: paymentMethod,
        items: cart.map(c => ({
          name: c.item.name,
          category: c.item.category,
          quantity: c.quantity,
          price: c.item.price,
          notes: c.notes || ""
        })),
        total_price: cartTotal,
        status: "pendente",
        estimated_minutes: 8,
        created_at: new Date().toISOString()
      });

      // 3. Baixa FEFO de estoque
      for (const c of cart) {
        try {
          await stockService.processSaleDeduction(tenantId, c.item.name, c.quantity);
        } catch (e) {
          console.warn("Baixa estoque:", e);
        }
      }

      setSuccessMsg(`Pedido #${orderNumber} faturado e despachado para a cozinha!`);
      setCart([]);
      setCustomerName("");
      setAmountReceived("");
    } catch (e) {
      console.error(e);
      alert("Erro ao finalizar venda.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["todos", "entradas", "pratos", "bebidas", "sobremesas"];
  const filtered = menuItems.filter(m => {
    const matchesCat = selectedCategory === "todos" || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary"><ShoppingCart size={28} /></div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">PDV & Frente de Caixa</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Venda expressa com cálculo de troco e envio para cozinha.</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {successMsg && (
          <div className="p-3 bg-success/20 border border-success/40 text-success rounded-xl font-bold text-xs flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <div className="flex-1 flex flex-col xl:flex-row gap-6">
          {/* Catálogo */}
          <div className="flex-1">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                    selectedCategory === c ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(m => (
                <div key={m.id} onClick={() => addToCart(m)} className="bg-card border border-border p-4 rounded-2xl cursor-pointer hover:border-primary transition-all flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs line-clamp-1">{m.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border">
                    <span className="font-black text-sm text-success">{formatCurrency(m.price, currency)}</span>
                    <button className="p-1 rounded-lg bg-primary/10 text-primary"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrinho / Checkout */}
          <div className="w-full xl:w-96 bg-card border border-border rounded-3xl p-5 flex flex-col justify-between h-fit sticky top-6 shadow-sm">
            <div>
              <h3 className="font-black text-sm mb-3">Comanda de Balcão ({cart.length} itens)</h3>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Nome do cliente (Opcional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              {/* Itens do carrinho */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-3 divide-y divide-border/60">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">Carrinho vazio.</div>
                ) : (
                  cart.map(c => (
                    <div key={c.item.id} className="pt-2 first:pt-0">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{c.item.name}</span>
                        <span>{formatCurrency(c.item.price * c.quantity, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 rounded-lg p-1 border border-border">
                          <button onClick={() => updateQty(c.item.id, -1)} className="p-0.5"><Minus size={11} /></button>
                          <span className="text-xs font-bold px-2">{c.quantity}</span>
                          <button onClick={() => updateQty(c.item.id, 1)} className="p-0.5"><Plus size={11} /></button>
                        </div>
                        <button onClick={() => updateQty(c.item.id, -c.quantity)} className="text-destructive p-1"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagamento */}
              {cart.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border mb-3">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "cartao", label: "Cartão", icon: CreditCard },
                      { id: "dinheiro", label: "Numerário", icon: Banknote },
                      { id: "digital", label: "Digital", icon: QrCode },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id as any)}
                        className={`p-2 rounded-xl border text-[11px] flex flex-col items-center gap-0.5 ${
                          paymentMethod === p.id ? "bg-primary text-white border-primary font-bold" : "bg-black/5 dark:bg-white/5 border-border text-muted-foreground"
                        }`}
                      >
                        <p.icon size={14} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "dinheiro" && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="number"
                        placeholder="Valor entregue pelo cliente (€)"
                        value={amountReceived}
                        onChange={e => setAmountReceived(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2 text-xs text-foreground focus:outline-none"
                      />
                      {change > 0 && (
                        <p className="text-xs font-bold text-success">Troco a devolver: {formatCurrency(change, currency)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="font-bold text-muted-foreground uppercase">Total:</span>
                <span className="text-xl font-black">{formatCurrency(cartTotal, currency)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? "A processar..." : <><Send size={15} /> Finalizar e Despachar</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
