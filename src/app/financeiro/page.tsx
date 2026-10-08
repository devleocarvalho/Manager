"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { financeService } from "../../services/financeService";
import { FinancialTransaction } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Receipt, Plus } from "lucide-react";

export default function FinanceiroPage() {
  const { tenantId, currency } = useAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<"sales" | "cmv" | "operations">("operations");

  useEffect(() => {
    if (!tenantId) return;
    const unsub = financeService.subscribeTransactions(tenantId, setTransactions);
    return () => unsub();
  }, [tenantId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeService.addTransaction({
      tenant_id: tenantId,
      description: desc,
      amount: Number(amount),
      type,
      category,
      date: new Date().toISOString()
    });
    setShowForm(false);
    setDesc("");
    setAmount("");
  };

  const totalReceitas = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIva = transactions.reduce((s, t) => s + (t.vat_amount || 0), 0);
  const lucro = totalReceitas - totalDespesas;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary"><Wallet size={28} /></div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Financeiro & DRE</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Fluxo de caixa, discriminação de IVA e resultados operacionais.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus size={16} /> Novo Lançamento
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-success uppercase">Receitas Totais</span>
            <div className="text-2xl font-black text-foreground mt-1">{formatCurrency(totalReceitas, currency)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-destructive uppercase">Despesas / Custos</span>
            <div className="text-2xl font-black text-foreground mt-1">{formatCurrency(totalDespesas, currency)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-primary uppercase">IVA Retido</span>
            <div className="text-2xl font-black text-foreground mt-1">{formatCurrency(totalIva, currency)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-accent uppercase">Lucro Líquido</span>
            <div className="text-2xl font-black text-foreground mt-1">{formatCurrency(lucro, currency)}</div>
          </div>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border border-border p-5 rounded-3xl mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Descrição</label>
              <input required type="text" placeholder="Ex: Conta de Luz / Aluguer" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Valor (€)</label>
              <input required type="number" step="0.01" placeholder="Ex: 150.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5">
                <option value="operations">Operacional</option>
                <option value="cmv">Custo Mercadoria (CMV)</option>
                <option value="sales">Vendas</option>
              </select>
            </div>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold">Salvar Lançamento</button>
            </div>
          </form>
        )}

        {/* Histórico */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border font-bold text-xs">Histórico de Transações ({transactions.length})</div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Nenhuma transação registrada.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {transactions.slice(0, 30).map(t => (
                <div key={t.id} className="p-4 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-foreground">{t.description}</h4>
                    <p className="text-muted-foreground text-[11px]">{new Date(t.date).toLocaleDateString("pt-PT")} • {t.category.toUpperCase()}</p>
                  </div>
                  <div className={`font-black text-sm ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount, currency)}
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
