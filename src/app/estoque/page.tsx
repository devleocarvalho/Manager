"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { stockService } from "../../services/stockService";
import { InventoryItem } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { Package, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function EstoquePage() {
  const { tenantId, currency } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lote, setLote] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<any>("kg");
  const [days, setDays] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    const unsub = stockService.subscribeStock(tenantId, setItems);
    return () => unsub();
  }, [tenantId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await stockService.addStockBatch({
      tenant_id: tenantId,
      name,
      lote,
      quantity: Number(qty),
      unit,
      days_to_expire: Number(days),
      cost_price: Number(cost),
      supplier
    });

    setShowForm(false);
    setName("");
    setLote("");
    setQty("");
    setDays("");
    setCost("");
    setSupplier("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary"><Package size={28} /></div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Estoque & Insumos</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Controle por lote e validade (Método FEFO europeu).</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus size={16} /> {showForm ? "Fechar" : "Nova Entrada"}
            </button>
            <ThemeToggle />
          </div>
        </header>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border border-border p-5 rounded-3xl mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Nome do Insumo</label>
              <input required type="text" placeholder="Ex: Queijo Cheddar" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Lote</label>
              <input required type="text" placeholder="Ex: L-2026" value={lote} onChange={e => setLote(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Quantidade e Unidade</label>
              <div className="flex gap-1">
                <input required type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
                <select value={unit} onChange={e => setUnit(e.target.value)} className="bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">L</option>
                  <option value="un">un</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Dias p/ Vencer</label>
              <input required type="number" placeholder="Ex: 15" value={days} onChange={e => setDays(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Custo Unitário (€)</label>
              <input required type="number" step="0.01" placeholder="Ex: 4.50" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Fornecedor</label>
              <input type="text" placeholder="Ex: Distribuidor Norte" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold">Salvar Lote</button>
            </div>
          </form>
        )}

        {/* Tabela de Insumos */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border font-bold text-xs">Lotes Cadastrados ({items.length})</div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Nenhum lote registrado.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map(it => (
                <div key={it.id} className="p-4 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{it.name}</h4>
                    <p className="text-muted-foreground text-[11px]">Lote: {it.lote} • Fornecedor: {it.supplier || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-black text-sm">{it.quantity} {it.unit}</span>
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(it.cost_price, currency)} / {it.unit}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      it.days_to_expire <= 5 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                    }`}>
                      {it.days_to_expire} dias
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
