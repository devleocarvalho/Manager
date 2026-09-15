"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { StockRadar } from "../../components/StockRadar";
import { InventoryList } from "../../components/InventoryList";
import { InvoiceScannerModal } from "../../components/InvoiceScannerModal";
import { Package, Plus, QrCode, Sparkles } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function EstoquePage() {
  const { tenantId } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    lote: "",
    quantity: "",
    unit: "un",
    days_to_expire: "",
    locator: "",
    cost_price: "",
    supplier: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalCost = Number(formData.quantity) * Number(formData.cost_price);

      await addDoc(collection(db, "inventory_items"), {
        tenant_id: tenantId,
        name: formData.name,
        lote: formData.lote,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        days_to_expire: Number(formData.days_to_expire),
        locator: formData.locator,
        cost_price: Number(formData.cost_price),
        supplier: formData.supplier,
        purchases: [{
          date: new Date().toISOString(),
          supplier: formData.supplier,
          price: Number(formData.cost_price),
          quantity: Number(formData.quantity),
          unit: formData.unit
        }]
      });

      // Lançamento Automático no Financeiro (CMV)
      await addDoc(collection(db, "financial_transactions"), {
        tenant_id: tenantId,
        type: "expense",
        category: "cmv",
        amount: totalCost,
        description: `Compra de Estoque (${formData.name}) - Forn: ${formData.supplier}`,
        date: new Date().toISOString()
      });

      setShowForm(false);
      setFormData({ name: "", lote: "", quantity: "", unit: "un", days_to_expire: "", locator: "", cost_price: "", supplier: "" });
      alert("Lote adicionado com sucesso e despesa registrada no financeiro!");
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar no Firebase.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <Package size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Gestão de Estoque & Lotes
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Importe notas fiscais via QR Code/XML ou faça entradas manuais de mercadorias.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botão Chamativo: Leitor de Nota Fiscal */}
            <button 
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/25 transition-all active:scale-95"
            >
              <QrCode size={18} />
              Ler Nota Fiscal (QR Code / XML)
            </button>

            {/* Entrada Manual */}
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-bold text-xs transition-all"
            >
              <Plus size={16} />
              {showForm ? "Fechar Formulário" : "Entrada Manual"}
            </button>

            <ThemeToggle />
          </div>
        </header>

        {/* Formulário de Entrada Manual */}
        {showForm && (
          <section className="glass rounded-3xl p-6 mb-8 border border-border">
            <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              Registrar Entrada Manual de Lote
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Nome do Insumo (ex: Farinha de Trigo, Pão Brioche)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Número do Lote</label>
                <input required type="text" value={formData.lote} onChange={e => setFormData({...formData, lote: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Quantidade e Unidade</label>
                <div className="flex gap-2">
                  <input required type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="flex-1 bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" placeholder="Qtd" />
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-24 bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                    <option value="un">Un (Und)</option>
                    <option value="kg">Kg (Quilo)</option>
                    <option value="g">g (Grama)</option>
                    <option value="l">L (Litro)</option>
                    <option value="ml">ml (Milili)</option>
                    <option value="pct">Pct (Pcte)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Custo Unitário (R$ / {formData.unit})</label>
                <input required type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" placeholder={`Ex: Custo por 1 ${formData.unit}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Dias para Vencer</label>
                <input required type="number" value={formData.days_to_expire} onChange={e => setFormData({...formData, days_to_expire: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Fornecedor</label>
                <input required type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1">Localizador (Ex: Prateleira 2, Freezer Carne)</label>
                <input required type="text" value={formData.locator} onChange={e => setFormData({...formData, locator: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25">Salvar Lote no Estoque</button>
              </div>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <StockRadar />
        </div>

        <InventoryList key={refreshKey} />

        {/* Modal de Importação de Nota Fiscal */}
        <InvoiceScannerModal 
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      </main>
    </div>
  );
}

