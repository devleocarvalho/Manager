"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Clock, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  cost_price: number;
  unit?: string;
  lote?: string;
}

interface IngredientLine {
  name: string;
  quantity: string;
  unit: "g" | "kg" | "un" | "fatias" | "ml" | "l" | "pct";
  unitCost: number; // Custo base do estoque
  inventoryUnit?: string; // Unidade base no estoque (para conversão)
}

interface TechnicalSheet {
  id: string;
  menuItemId: string;
  menuItemName: string;
  category: "lanches" | "combos" | "porcoes" | "bebidas" | "sobremesas";
  salePrice: number;
  estimatedPrepMinutes: number;
  estimatedCost: number;
  items: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityNeeded: number;
    unit: string;
    unitCost?: number;
  }>;
  createdAt?: string;
}

// Presets rápidos para hamburguerias e lanchonetes
const INSUMO_PRESETS = [
  { name: "Pão Brioche Tradicional", unit: "un", defaultQty: "1", defaultCost: 1.80 },
  { name: "Pão Australiano", unit: "un", defaultQty: "1", defaultCost: 2.20 },
  { name: "Blend Bovino (160g)", unit: "un", defaultQty: "1", defaultCost: 4.50 },
  { name: "Smash Burger (90g)", unit: "un", defaultQty: "1", defaultCost: 2.70 },
  { name: "Peito de Frango Empanado", unit: "un", defaultQty: "1", defaultCost: 3.50 },
  { name: "Fatias de Queijo Cheddar", unit: "fatias", defaultQty: "2", defaultCost: 0.90 },
  { name: "Fatias de Queijo Prato", unit: "fatias", defaultQty: "2", defaultCost: 0.85 },
  { name: "Bacon em Tiras Crocante", unit: "fatias", defaultQty: "3", defaultCost: 1.20 },
  { name: "Maionese Verde Artesanal", unit: "g", defaultQty: "30", defaultCost: 0.03 },
  { name: "Molho Barbecue Especial", unit: "g", defaultQty: "25", defaultCost: 0.04 },
  { name: "Alface Americana Fresca", unit: "g", defaultQty: "20", defaultCost: 0.02 },
  { name: "Rodelas de Tomate Fresco", unit: "fatias", defaultQty: "2", defaultCost: 0.40 },
  { name: "Picles Agridoce Artesanal", unit: "g", defaultQty: "15", defaultCost: 0.05 },
  { name: "Cebola Caramelizada", unit: "g", defaultQty: "30", defaultCost: 0.04 },
  { name: "Embalagem Kraft Burger", unit: "un", defaultQty: "1", defaultCost: 0.60 },
  { name: "Batata Congelada Palito", unit: "g", defaultQty: "200", defaultCost: 0.018 }
];

export default function FichasTecnicasPage() {
  const { tenantId } = useAuth();
  const [sheets, setSheets] = useState<TechnicalSheet[]>([]);
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<"lanches" | "combos" | "porcoes" | "bebidas" | "sobremesas">("lanches");
  const [salePrice, setSalePrice] = useState("");
  const [prepMinutes, setPrepMinutes] = useState("8");
  const [ingredients, setIngredients] = useState<IngredientLine[]>([
    { name: "", quantity: "", unit: "un", unitCost: 0 }
  ]);

  // Carrega insumos do estoque e fichas técnicas em tempo real
  useEffect(() => {
    if (!tenantId) return;

    // Insumos do Estoque
    const invQuery = query(collection(db, "inventory_items"), where("tenant_id", "==", tenantId));
    const unsubInv = onSnapshot(invQuery, (snapshot) => {
      const items: InventoryItem[] = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name || "",
        quantity: Number(d.data().quantity) || 0,
        cost_price: Number(d.data().cost_price) || 0,
        unit: d.data().unit || "un",
        lote: d.data().lote
      }));
      setStockItems(items);
    });

    // Fichas Técnicas
    const sheetQuery = query(collection(db, "technical_sheets"), where("tenant_id", "==", tenantId));
    const unsubSheet = onSnapshot(sheetQuery, (snapshot) => {
      const list: TechnicalSheet[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as TechnicalSheet));
      setSheets(list);
      setLoading(false);
    });

    return () => {
      unsubInv();
      unsubSheet();
    };
  }, [tenantId]);

  const addIngredientLine = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "un", unitCost: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof IngredientLine, value: any) => {
    const newIng = [...ingredients];
    newIng[index] = { ...newIng[index], [field]: value };

    // Se mudou o nome, verifica se bate com algum insumo do estoque para puxar custo automaticamente
    if (field === "name") {
      const foundStock = stockItems.find(s => s.name.toLowerCase() === String(value).toLowerCase());
      if (foundStock && foundStock.cost_price > 0) {
        newIng[index].unitCost = foundStock.cost_price;
        newIng[index].inventoryUnit = foundStock.unit;
        
        // Sugestão de unidade inteligente
        if (foundStock.unit === "kg") newIng[index].unit = "g";
        else if (foundStock.unit === "l") newIng[index].unit = "ml";
        else newIng[index].unit = foundStock.unit as any || "un";
      } else {
        const foundPreset = INSUMO_PRESETS.find(p => p.name.toLowerCase() === String(value).toLowerCase());
        if (foundPreset) {
          newIng[index].unitCost = foundPreset.defaultCost;
          newIng[index].unit = foundPreset.unit as any;
          newIng[index].inventoryUnit = foundPreset.unit;
          if (!newIng[index].quantity) newIng[index].quantity = foundPreset.defaultQty;
        }
      }
    }

    setIngredients(newIng);
  };

  const applyPresetToLine = (index: number, preset: typeof INSUMO_PRESETS[0]) => {
    const newIng = [...ingredients];
    newIng[index] = {
      name: preset.name,
      quantity: preset.defaultQty,
      unit: preset.unit as any,
      unitCost: preset.defaultCost,
      inventoryUnit: preset.unit
    };
    setIngredients(newIng);
  };

  // Cálculo de Custo Estimado da Receita (CMV Unitário) com Conversão
  const totalCostEstimated = ingredients.reduce((sum, ing) => {
    const qty = Number(ing.quantity) || 0;
    let costPerUnit = Number(ing.unitCost) || 0;

    // Se a receita usa gramas e o estoque é em Kg (ou ml/Litro), converte o preço
    if (ing.inventoryUnit === "kg" && ing.unit === "g") {
      costPerUnit = costPerUnit / 1000;
    } else if (ing.inventoryUnit === "l" && ing.unit === "ml") {
      costPerUnit = costPerUnit / 1000;
    }

    return sum + (qty * costPerUnit);
  }, 0);

  // Margem de Lucro Bruto Estimada
  const numericSalePrice = Number(salePrice) || 0;
  const grossProfit = numericSalePrice - totalCostEstimated;
  const grossMarginPercent = numericSalePrice > 0 ? (grossProfit / numericSalePrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Por favor, informe o nome do produto.");
      return;
    }
    if (ingredients.some(i => !i.name || !i.quantity)) {
      alert("Preencha todos os insumos e suas respectivas quantidades.");
      return;
    }

    setSaving(true);
    try {
      const formattedItems = ingredients.map(ing => ({
        ingredientId: ing.name.toLowerCase().trim().replace(/ /g, "_"),
        ingredientName: ing.name.trim(),
        quantityNeeded: Number(ing.quantity),
        unit: ing.unit,
        unitCost: ing.unitCost || 0,
        inventoryUnit: ing.inventoryUnit || ing.unit
      }));

      await addDoc(collection(db, "technical_sheets"), {
        tenant_id: tenantId,
        menuItemId: productName.toLowerCase().trim().replace(/ /g, "_"),
        menuItemName: productName.trim(),
        category,
        salePrice: Number(salePrice) || 0,
        estimatedPrepMinutes: Number(prepMinutes) || 8,
        estimatedCost: totalCostEstimated,
        items: formattedItems,
        createdAt: new Date().toISOString()
      });

      setShowForm(false);
      setProductName("");
      setSalePrice("");
      setPrepMinutes("8");
      setIngredients([{ name: "", quantity: "", unit: "un", unitCost: 0 }]);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar Ficha Técnica.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSheet = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a composição de "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "technical_sheets", id));
    } catch (err) {
      console.error("Erro ao deletar ficha:", err);
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
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
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Padronize ingredientes, controle o custo unitário e sincronize tempo com a cozinha.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25 active:scale-95"
            >
              <Plus size={16} />
              {showForm ? "Fechar Formulário" : "Nova Composição"}
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Formulário de Criação Inteligente */}
        {showForm && (
          <section className="glass rounded-3xl p-6 mb-8 border border-border animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-black text-foreground">Montar Ficha Técnica do Produto</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha os insumos utilizados. O Manager calculará o custo em tempo real e dará baixa automática no estoque em cada venda.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-xl">
                <Sparkles size={16} />
                <span>Autocomplete Ativo</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas do Produto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Nome do Produto de Venda *
                  </label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ex: Smash Burger Especial, Combo Bacon Master" 
                    value={productName} 
                    onChange={e => setProductName(e.target.value)} 
                    className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-bold" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Categoria do Cardápio
                  </label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="lanches">Lanches & Burgers</option>
                    <option value="combos">Combos & Refeições</option>
                    <option value="porcoes">Porções & Acompanhamentos</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="sobremesas">Sobremesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Tempo Estimado de Cozinha (min)
                  </label>
                  <div className="relative">
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max="60"
                      value={prepMinutes} 
                      onChange={e => setPrepMinutes(e.target.value)} 
                      className="w-full bg-card border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-bold" 
                    />
                    <Clock size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Insumos da Composição */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Package size={18} className="text-primary" />
                    Insumos & Quantidades Utilizadas
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Insumos cadastrados no estoque aparecem nas sugestões
                  </span>
                </div>

                {/* Datalist para autocomplete de estoque e presets */}
                <datalist id="insumos-sugestoes">
                  {stockItems.map(item => (
                    <option key={item.id} value={item.name}>
                      Estoque: {item.quantity} disponíveis (R$ {item.cost_price.toFixed(2)})
                    </option>
                  ))}
                  {INSUMO_PRESETS.map((p, idx) => (
                    <option key={`preset-${idx}`} value={p.name}>
                      Preset: {p.unit} (~R$ {p.defaultCost.toFixed(2)})
                    </option>
                  ))}
                </datalist>

                {/* Linhas de Insumos */}
                <div className="space-y-3">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Insumo (Digite ou selecione)
                        </label>
                        <input 
                          required 
                          list="insumos-sugestoes"
                          type="text" 
                          placeholder="Ex: Pão Brioche, Blend Bovino 160g"
                          value={ing.name} 
                          onChange={e => handleIngredientChange(index, 'name', e.target.value)} 
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-medium" 
                        />
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Unidade
                        </label>
                        <select
                          value={ing.unit}
                          onChange={e => handleIngredientChange(index, 'unit', e.target.value)}
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="un">un (unidade)</option>
                          <option value="g">g (gramas)</option>
                          <option value="kg">kg (quilos)</option>
                          <option value="fatias">fatias</option>
                          <option value="ml">ml (mililitros)</option>
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Qtd Usada
                        </label>
                        <input 
                          required 
                          type="number" 
                          step="any"
                          min="0.01"
                          placeholder="1"
                          value={ing.quantity} 
                          onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} 
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-bold" 
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Custo Unit. (R$)
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={ing.unitCost || ""} 
                          onChange={e => handleIngredientChange(index, 'unitCost', Number(e.target.value))} 
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary text-right" 
                          placeholder="0.00"
                        />
                      </div>

                      <div className="w-24 text-right py-2 text-xs font-bold text-muted-foreground">
                        = R$ {((Number(ing.quantity) || 0) * (Number(ing.unitCost) || 0)).toFixed(2)}
                      </div>

                      {ingredients.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeIngredient(index)} 
                          className="p-2.5 bg-destructive/20 text-destructive rounded-xl hover:bg-destructive/30 transition-colors"
                          title="Remover Insumo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={addIngredientLine} 
                    className="text-xs font-bold text-primary flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <Plus size={16} /> Adicionar outro insumo
                  </button>

                  {/* Presets Rápidos para clique instantâneo */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground text-[11px] font-medium mr-1">Presets rápidos:</span>
                    {INSUMO_PRESETS.slice(0, 5).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const emptyIdx = ingredients.findIndex(i => !i.name);
                          if (emptyIdx !== -1) {
                            applyPresetToLine(emptyIdx, preset);
                          } else {
                            setIngredients([...ingredients, {
                              name: preset.name,
                              quantity: preset.defaultQty,
                              unit: preset.unit as any,
                              unitCost: preset.defaultCost
                            }]);
                          }
                        }}
                        className="px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-border hover:border-primary rounded-lg text-[11px] font-medium transition-all"
                      >
                        + {preset.name.split(" ")[0]} {preset.name.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro da Ficha (CMV vs Preço de Venda) */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">Custo dos Insumos (CMV)</span>
                  <div className="text-xl font-black text-foreground">
                    R$ {totalCostEstimated.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Soma de todos os ingredientes da porção</p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-muted-foreground mb-1">
                    Preço de Venda Sugerido / Definido (R$) *
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.10"
                    min="0"
                    placeholder={`Ex: ${(totalCostEstimated * 2.8).toFixed(2)}`}
                    value={salePrice} 
                    onChange={e => setSalePrice(e.target.value)} 
                    className="w-full bg-card border border-border rounded-xl p-2 text-sm text-foreground focus:outline-none focus:border-primary font-black" 
                  />
                </div>

                <div>
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">Lucro Bruto & Margem</span>
                  <div className={`text-lg font-black ${grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {numericSalePrice > 0 ? (
                      <>R$ {grossProfit.toFixed(2)} <span className="text-xs">({grossMarginPercent.toFixed(1)}%)</span></>
                    ) : (
                      <span className="text-xs text-muted-foreground">Informe o preço de venda</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Margem recomendada para Food Service: 60% a 70%</p>
                </div>
              </div>

              {/* Ações do Formulário */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-7 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  {saving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Salvar Composição
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Lista de Fichas Técnicas Ativas */}
        <section className="glass rounded-3xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Layers size={22} className="text-primary" />
                Composições Cadastradas
              </h3>
              <p className="text-muted-foreground text-xs">
                Produtos cadastrados aqui são sincronizados automaticamente com o PDV, Cozinha e baixa de Estoque.
              </p>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-border">
              Total: {sheets.length} produtos
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Carregando fichas técnicas...
            </div>
          ) : sheets.length === 0 ? (
            <div className="py-12 text-center">
              <Layers size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-bold text-foreground">Nenhuma composição cadastrada ainda</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Clique em "Nova Composição" para cadastrar seu primeiro hambúrguer, combo ou porção com insumos vinculados ao estoque.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sheets.map(sheet => (
                <div 
                  key={sheet.id}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {sheet.category || "lanches"}
                        </span>
                        <h4 className="text-base font-black text-foreground mt-1">
                          {sheet.menuItemName}
                        </h4>
                      </div>
                      <button 
                        onClick={() => handleDeleteSheet(sheet.id, sheet.menuItemName)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Excluir Composição"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 mb-3 border-y border-border text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Preço</span>
                        <p className="text-xs font-black text-success">
                          R$ {Number(sheet.salePrice || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Custo Insumos</span>
                        <p className="text-xs font-bold text-foreground">
                          R$ {Number(sheet.estimatedCost || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Preparo Est.</span>
                        <p className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                          <Clock size={12} />
                          {sheet.estimatedPrepMinutes || 8} min
                        </p>
                      </div>
                    </div>

                    {/* Ingredientes */}
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                        Insumos da Receita ({sheet.items?.length || 0}):
                      </span>
                      <ul className="space-y-1">
                        {sheet.items?.map((item, i) => (
                          <li key={i} className="text-xs text-foreground flex justify-between items-center py-0.5 border-b border-border/50 last:border-0">
                            <span className="font-medium truncate mr-2">• {item.ingredientName}</span>
                            <span className="text-muted-foreground text-[11px] font-mono whitespace-nowrap">
                              {item.quantityNeeded} {item.unit || "un"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Baixa FEFO ativa</span>
                    <span className="text-success font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Sincronizado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
