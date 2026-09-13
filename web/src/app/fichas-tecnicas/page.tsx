"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Layers, Plus, Trash2 } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function FichasTecnicasPage() {
  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);

  const addIngredientLine = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIng = [...ingredients];
    newIng[index] = { ...newIng[index], [field]: value };
    setIngredients(newIng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedItems = ingredients.map(ing => ({
        ingredientId: ing.name.toLowerCase().replace(/ /g, "_"),
        ingredientName: ing.name,
        quantityNeeded: Number(ing.quantity)
      }));

      await addDoc(collection(db, "technical_sheets"), {
        tenant_id: "tenant-demo",
        menuItemId: productName.toLowerCase().replace(/ /g, "_"),
        menuItemName: productName,
        items: formattedItems
      });

      alert("Composição criada! Agora, quando este produto for vendido, esses itens serão deduzidos do estoque.");
      setShowForm(false);
      setProductName("");
      setIngredients([{ name: "", quantity: "" }]);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar Ficha Técnica.");
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
                <Layers size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Composições (Fichas Técnicas)
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Configure exatamente o que compõe cada lanche, combo ou porção.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
            >
              <Plus size={16} />
              Nova Composição
            </button>
            <ThemeToggle />
          </div>
        </header>

        {showForm && (
          <section className="glass rounded-3xl p-6 mb-8 border border-border">
            <h3 className="text-lg font-black text-foreground mb-4">Montar Nova Composição</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Nome do Produto de Venda (ex: X-Burger Duplo, Combo Especial)</label>
                <input required type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>

              <div>
                <h4 className="text-sm font-black text-foreground mb-3 border-b border-border pb-2">Composição de Insumos</h4>
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex items-end gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1">Insumo do Estoque (Ex: Pão Brioche, Carne)</label>
                      <input 
                        required 
                        type="text" 
                        value={ing.name} 
                        onChange={e => handleIngredientChange(index, 'name', e.target.value)} 
                        className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" 
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1">Qtd Usada</label>
                      <input 
                        required 
                        type="number" 
                        value={ing.quantity} 
                        onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} 
                        className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" 
                      />
                    </div>
                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => removeIngredient(index)} className="p-2.5 bg-destructive/20 text-destructive rounded-xl hover:bg-destructive/30">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button type="button" onClick={addIngredientLine} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-2">
                  <Plus size={14} /> Adicionar mais um insumo
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25">Salvar Composição</button>
              </div>
            </form>
          </section>
        )}

        <section className="glass rounded-3xl p-6 border border-border">
          <h3 className="text-lg font-black text-foreground mb-4">Composições Integradas</h3>
          <p className="text-muted-foreground text-xs">As composições de lanches e combos estão ativas e vinculadas ao leitor de notas fiscais e ao PDV.</p>
        </section>
      </main>
    </div>
  );
}
