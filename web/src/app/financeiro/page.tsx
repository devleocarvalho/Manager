"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Wallet, Download, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import { collection, onSnapshot, query, where, addDoc, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Totals
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    type: "expense",
    category: "operational",
    amount: "",
    description: ""
  });

  useEffect(() => {
    const q = query(
      collection(db, "financial_transactions"),
      where("tenant_id", "==", "tenant-demo")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let income = 0;
      let expense = 0;
      const docs: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({ id: doc.id, ...data });

        if (data.type === "income") income += Number(data.amount);
        if (data.type === "expense") expense += Number(data.amount);
      });

      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTotalIncome(income);
      setTotalExpense(expense);
      setTransactions(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "financial_transactions"), {
        tenant_id: "tenant-demo",
        type: formData.type,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
        date: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({ type: "expense", category: "operational", amount: "", description: "" });
      alert("Lançamento registrado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar transação.");
    }
  };

  const saldo = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <Wallet size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Gestão Financeira
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Acompanhe entradas, saídas e o DRE da operação em tempo real.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
            >
              <Plus size={16} />
              Novo Lançamento
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Entradas (Receitas)</p>
              <div className="p-2.5 rounded-xl bg-success/20 text-success"><TrendingUp size={20} /></div>
            </div>
            <h3 className="text-2xl font-black text-foreground">R$ {totalIncome.toFixed(2)}</h3>
          </div>
          
          <div className="glass-panel relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Saídas (Despesas + CMV)</p>
              <div className="p-2.5 rounded-xl bg-destructive/20 text-destructive"><TrendingDown size={20} /></div>
            </div>
            <h3 className="text-2xl font-black text-foreground">R$ {totalExpense.toFixed(2)}</h3>
          </div>

          <div className="glass-panel relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Saldo Atual</p>
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary"><DollarSign size={20} /></div>
            </div>
            <h3 className={`text-2xl font-black ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {saldo.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Formulário Manual */}
        {showForm && (
          <section className="glass rounded-3xl p-6 mb-8 border border-border">
            <h3 className="text-lg font-black text-foreground mb-4">Novo Lançamento Manual</h3>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Tipo</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option value="expense">Saída (Despesa)</option>
                  <option value="income">Entrada (Receita)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option value="operational">Custo Operacional (Luz, Água, Salário)</option>
                  <option value="sales">Venda Avulsa</option>
                  <option value="loss">Perda / Desperdício</option>
                  <option value="other">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Valor (R$)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Descrição</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Conta de Luz" className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/25">Registrar Lançamento</button>
              </div>
            </form>
          </section>
        )}

        {/* Tabela de Transações */}
        <section className="glass rounded-3xl p-6 border border-border">
          <h3 className="text-lg font-black text-foreground mb-6">Histórico de Transações</h3>
          
          {loading ? (
            <p className="text-muted-foreground text-xs">Carregando dados financeiros...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-xs">Nenhuma transação registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 text-muted-foreground font-medium">
                        {new Date(tx.date).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 text-foreground font-bold">{tx.description}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-1 bg-black/5 dark:bg-white/10 text-foreground/80 rounded-lg text-[10px] uppercase font-bold">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right font-black ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
