"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ShieldAlert, 
  Sparkles,
  Layers,
  HelpCircle,
  Package,
  Save,
  Search,
  X,
  Check
} from "lucide-react";
import { pricingService, PricingSimulationResult } from "../../services/pricingService";
import { stockService } from "../../services/stockService";
import { RecipeIngredientCost, CurrencyCode, InventoryItem, TechnicalSheetItem } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { useLanguage } from "../../context/LanguageContext";

interface EscandalloSimulatorProps {
  currency: CurrencyCode;
  tenantId?: string;
}

export function EscandalloSimulator({ currency, tenantId }: EscandalloSimulatorProps) {
  const { t } = useLanguage();
  const defaultRecipes = useMemo(() => pricingService.getDefaultRecipes(), []);
  
  const [selectedRecipeId, setSelectedRecipeId] = useState(defaultRecipes[0].id);
  const [dishName, setDishName] = useState(defaultRecipes[0].dishName);
  const [category, setCategory] = useState(defaultRecipes[0].category);
  const [currentSalePrice, setCurrentSalePrice] = useState<number>(defaultRecipes[0].currentSalePrice);
  const [targetMargin, setTargetMargin] = useState<number>(65); // 65% margem bruta alvo padrão
  const [overheadPercent, setOverheadPercent] = useState<number>(25); // 25% rateio de despesas fixas
  const [vatRate, setVatRate] = useState<number>(13); // IVA 13% restauração em Portugal
  const [ingredients, setIngredients] = useState<RecipeIngredientCost[]>(defaultRecipes[0].ingredients);

  // Estados de Integração com o Estoque
  const [stockInventory, setStockInventory] = useState<InventoryItem[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Escuta o estoque real do restaurante
  useEffect(() => {
    if (!tenantId) return;
    const unsub = stockService.subscribeStock(tenantId, (items) => {
      setStockInventory(items);
    });
    return () => unsub();
  }, [tenantId]);

  // Troca de receita pré-configurada
  const handleSelectRecipe = (id: string) => {
    const found = defaultRecipes.find(r => r.id === id);
    if (!found) return;
    setSelectedRecipeId(id);
    setDishName(found.dishName);
    setCategory(found.category);
    setCurrentSalePrice(found.currentSalePrice);
    setIngredients([...found.ingredients]);
  };

  // Atualiza preço de compra ou porção de um ingrediente e recalcula na hora
  const updateIngredient = (index: number, field: keyof RecipeIngredientCost, val: any) => {
    setIngredients(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      // Recalcula custo da porção
      item.portionCost = pricingService.calculatePortionCost(
        Number(item.purchasePackagePrice) || 0,
        Number(item.purchasePackageQty) || 1,
        item.purchaseUnit,
        Number(item.portionQty) || 0,
        item.portionUnit
      );

      copy[index] = item;
      return copy;
    });
  };

  // Adiciona novo insumo personalizado / manual
  const addIngredient = () => {
    const newIng: RecipeIngredientCost = {
      ingredientId: `custom_${Date.now()}`,
      name: "Novo Insumo",
      purchasePackagePrice: 10.00,
      purchasePackageQty: 1,
      purchaseUnit: "kg",
      portionQty: 100,
      portionUnit: "g",
      portionCost: 1.00,
      isFromStock: false
    };
    setIngredients([...ingredients, newIng]);
  };

  // Adiciona insumo diretamente do estoque real
  const handleAddFromStock = (stockItem: InventoryItem) => {
    const purchaseUnit = (["kg", "g", "l", "ml", "un"].includes(stockItem.unit) ? stockItem.unit : "kg") as any;
    const portionUnit = purchaseUnit === "kg" ? "g" : purchaseUnit === "l" ? "ml" : purchaseUnit;
    const portionQty = portionUnit === "g" ? 100 : portionUnit === "ml" ? 50 : 1;

    const portionCost = pricingService.calculatePortionCost(
      stockItem.cost_price || 0,
      1,
      purchaseUnit,
      portionQty,
      portionUnit
    );

    const newIng: RecipeIngredientCost = {
      ingredientId: stockItem.id || `stock_${Date.now()}`,
      name: stockItem.name,
      purchasePackagePrice: stockItem.cost_price || 0,
      purchasePackageQty: 1,
      purchaseUnit,
      portionQty,
      portionUnit,
      portionCost,
      inventoryItemId: stockItem.id,
      isFromStock: true
    };

    setIngredients(prev => [...prev, newIng]);
    setShowStockModal(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Salva ficha técnica oficial no Firestore (usada depois para baixa FEFO automática)
  const handleSaveTechnicalSheet = async () => {
    if (!tenantId) {
      alert("Tenant ID não identificado.");
      return;
    }
    setIsSaving(true);
    try {
      const items: TechnicalSheetItem[] = ingredients.map(ing => ({
        ingredientId: ing.ingredientId,
        ingredientName: ing.name,
        quantityNeeded: ing.portionQty,
        unit: ing.portionUnit,
        unitCost: ing.portionCost,
        inventoryUnit: ing.purchaseUnit
      }));

      await stockService.saveTechnicalSheet({
        tenant_id: tenantId,
        menuItemId: selectedRecipeId,
        menuItemName: dishName,
        category,
        salePrice: currentSalePrice,
        estimatedCost: simulation.breakdown.directFoodCost,
        vatRate,
        items
      });

      setSaveSuccessMsg(t.escandallo.sheetSavedSuccess);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Erro ao salvar ficha técnica:", err);
      alert("Erro ao salvar ficha técnica.");
    } finally {
      setIsSaving(false);
    }
  };

  // Executa o cálculo da simulação
  const simulation: PricingSimulationResult = useMemo(() => {
    return pricingService.generateFullSimulation(
      dishName,
      category,
      ingredients,
      currentSalePrice,
      targetMargin,
      overheadPercent,
      vatRate
    );
  }, [dishName, category, ingredients, currentSalePrice, targetMargin, overheadPercent, vatRate]);

  const { breakdown, marginTiers, inflationSensitivity } = simulation;
  const isLoss = breakdown.netProfitUnit < 0;

  const cmvDirectPercent = currentSalePrice > 0 ? (breakdown.directFoodCost / currentSalePrice) * 100 : 0;
  const grossProfitUnit = Math.max(0, currentSalePrice - breakdown.directFoodCost);
  const grossMarginPercent = currentSalePrice > 0 ? (grossProfitUnit / currentSalePrice) * 100 : 0;
  const netMarginPercent = currentSalePrice > 0 ? (breakdown.netProfitUnit / currentSalePrice) * 100 : 0;

  const filteredStock = stockInventory.filter(item => 
    item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    (item.lote && item.lote.toLowerCase().includes(stockSearchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Topo do Módulo Escandallo */}
      <div className="bg-card border border-border p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">
                {t.escandallo.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.escandallo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Seleção de Receita / Prato para Simular */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground">
            {t.escandallo.recipeSelection}
          </span>
          <select
            value={selectedRecipeId}
            onChange={e => handleSelectRecipe(e.target.value)}
            className="bg-black/5 dark:bg-white/5 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
          >
            {defaultRecipes.map(r => (
              <option key={r.id} value={r.id}>
                {r.dishName} ({r.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerta de Feedback de Salvamento */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="p-1 hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Alerta de Prejuízo (Break-even não atingido) */}
      {isLoss && (
        <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center gap-3">
          <AlertTriangle size={24} className="shrink-0 animate-pulse" />
          <div className="text-xs">
            <strong className="block text-sm font-black uppercase tracking-wide">
              {t.escandallo.lossAlert}
            </strong>
            <span>
              Preço atual de {formatCurrency(currentSalePrice, currency)} gera um prejuízo líquido unitário de{" "}
              <strong>{formatCurrency(breakdown.netProfitUnit, currency)}</strong> por prato vendido.
            </span>
          </div>
        </div>
      )}

      {/* Cockpit de Indicadores Chave (Breakdown) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CMV Direto */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            {t.escandallo.kpiDirectCost}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {formatCurrency(breakdown.directFoodCost, currency)}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {cmvDirectPercent.toFixed(1)}% do preço de venda
          </span>
        </div>

        {/* Margem Bruta */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            {t.escandallo.kpiGrossMargin}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${grossMarginPercent < 55 ? "text-amber-500" : "text-success"}`}>
              {grossMarginPercent.toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Margem Bruta em valor: {formatCurrency(grossProfitUnit, currency)}
          </span>
        </div>

        {/* Lucro Líquido Unitário */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            {t.escandallo.kpiNetProfit}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${breakdown.netProfitUnit < 0 ? "text-destructive" : "text-primary"}`}>
              {formatCurrency(breakdown.netProfitUnit, currency)}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Margem Líquida Real: {netMarginPercent.toFixed(1)}%
          </span>
        </div>

        {/* Ponto de Equilíbrio (Break-Even) */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            {t.escandallo.kpiBreakeven}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {formatCurrency(breakdown.breakEvenPrice, currency)}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Preço mínimo com impostos sem prejuízo
          </span>
        </div>
      </div>

      {/* Painel de Variáveis Financeiras do Prato */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-primary" /> Parâmetros de Precificação & Venda
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Nome do Prato:
            </label>
            <input
              type="text"
              value={dishName}
              onChange={e => setDishName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-foreground font-bold focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              {t.escandallo.currentSalePrice}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">€</span>
              <input
                type="number"
                step="0.5"
                value={currentSalePrice}
                onChange={e => setCurrentSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl pl-7 p-2.5 text-xs text-foreground font-black focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              {t.escandallo.overheadPercent}
            </label>
            <div className="relative">
              <input
                type="number"
                value={overheadPercent}
                onChange={e => setOverheadPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-foreground font-bold focus:outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              {t.escandallo.vatRate}
            </label>
            <div className="relative">
              <input
                type="number"
                value={vatRate}
                onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-foreground font-bold focus:outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Insumos & Escandallo Detalhado com Conexão ao Estoque */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Layers size={16} className="text-primary" /> {t.escandallo.ingredientsTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.escandallo.ingredientsDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Adicionar Insumo do Estoque */}
            <button
              onClick={() => setShowStockModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-500/25 transition-all"
            >
              <Package size={14} /> {t.escandallo.addFromStock}
            </button>

            {/* Botão de Adicionar Insumo Manual */}
            <button
              onClick={addIngredient}
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              <Plus size={14} /> {t.escandallo.addCustomIngredient}
            </button>

            {/* Botão de Salvar Ficha Técnica no Sistema */}
            <button
              onClick={handleSaveTechnicalSheet}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? t.escandallo.saving : t.escandallo.saveTechnicalSheet}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                <th className="py-2.5">{t.escandallo.colIngredient}</th>
                <th className="py-2.5">{t.escandallo.colWholesalePrice}</th>
                <th className="py-2.5">{t.escandallo.colWholesalePack}</th>
                <th className="py-2.5">{t.escandallo.colPortion}</th>
                <th className="py-2.5">{t.escandallo.colOrigin}</th>
                <th className="py-2.5 text-right">{t.escandallo.colPortionCost}</th>
                <th className="py-2.5 text-center">{t.escandallo.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ingredients.map((ing, idx) => (
                <tr key={ing.ingredientId || idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={e => updateIngredient(idx, "name", e.target.value)}
                      className="bg-transparent border-b border-border/50 text-xs font-bold text-foreground focus:outline-none w-full max-w-[200px]"
                    />
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">€</span>
                      <input
                        type="number"
                        step="0.5"
                        value={ing.purchasePackagePrice}
                        onChange={e => updateIngredient(idx, "purchasePackagePrice", parseFloat(e.target.value) || 0)}
                        className="w-20 bg-black/5 dark:bg-white/5 border border-border rounded-lg p-1.5 text-xs text-foreground font-semibold focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={ing.purchasePackageQty}
                        onChange={e => updateIngredient(idx, "purchasePackageQty", parseFloat(e.target.value) || 1)}
                        className="w-14 bg-black/5 dark:bg-white/5 border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none"
                      />
                      <select
                        value={ing.purchaseUnit}
                        onChange={e => updateIngredient(idx, "purchaseUnit", e.target.value)}
                        className="bg-black/5 dark:bg-white/5 border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">L</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={ing.portionQty}
                        onChange={e => updateIngredient(idx, "portionQty", parseFloat(e.target.value) || 0)}
                        className="w-16 bg-black/5 dark:bg-white/5 border border-border rounded-lg p-1.5 text-xs text-foreground font-bold focus:outline-none"
                      />
                      <select
                        value={ing.portionUnit}
                        onChange={e => updateIngredient(idx, "portionUnit", e.target.value)}
                        className="bg-black/5 dark:bg-white/5 border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">L</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-2.5">
                    {ing.isFromStock || ing.inventoryItemId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        <Check size={10} /> {t.escandallo.stockLinked}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 dark:bg-white/5 text-muted-foreground border border-border">
                        {t.escandallo.custom}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-black text-sm text-foreground">
                    {formatCurrency(ing.portionCost, currency)}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title={t.escandallo.removeIngredient}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Escalas de Margem de Lucro e Sensibilidade à Inflação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escala de Margem de Lucro (50% a 75%) */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Percent size={16} className="text-success" /> Escala de Margem de Lucro Bruta
              </h3>
              <p className="text-xs text-muted-foreground">Preço final com IVA {vatRate}% para diferentes alvos</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-muted-foreground">Margem Alvo:</span>
              <select
                value={targetMargin}
                onChange={e => setTargetMargin(parseInt(e.target.value) || 65)}
                className="bg-black/5 dark:bg-white/5 border border-border rounded-xl px-2 py-1 text-xs font-bold text-foreground focus:outline-none"
              >
                <option value={50}>50%</option>
                <option value={55}>55%</option>
                <option value={60}>60%</option>
                <option value={65}>65% (Recomendado)</option>
                <option value={70}>70%</option>
                <option value={75}>75% (Alta Rentabilidade)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {marginTiers.map(tier => (
              <div
                key={tier.marginPercent}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  tier.marginPercent === targetMargin
                    ? "bg-success/15 border-success/40 text-foreground shadow-sm"
                    : "bg-black/5 dark:bg-white/5 border-border text-foreground hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-12 text-center text-xs font-black px-2 py-1 rounded-xl ${
                    tier.marginPercent === targetMargin ? "bg-success text-white" : "bg-black/10 dark:bg-white/10 text-muted-foreground"
                  }`}>
                    {tier.marginPercent}%
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">
                      Preço Venda: <strong className="text-sm font-black">{formatCurrency(tier.salePriceWithVat, currency)}</strong>
                    </h5>
                    <span className="text-[10px] text-muted-foreground">
                      Líquido sem IVA: {formatCurrency(tier.salePriceNet, currency)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-success block">
                    +{formatCurrency(tier.netProfitUnit, currency)} lucro
                  </span>
                  <span className="text-[10px] text-muted-foreground">por prato</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulação de Sensibilidade à Inflação de Fornecedores */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" /> Simulação de Inflação & Fornecedores
              </h3>
              <p className="text-xs text-muted-foreground">Impacto no lucro se os custos de matéria-prima subirem</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
              Gestão de Risco
            </span>
          </div>

          <div className="space-y-2.5">
            {inflationSensitivity.map(s => (
              <div
                key={s.costIncreasePercent}
                className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      s.costIncreasePercent === 0 
                        ? "bg-black/10 dark:bg-white/10 text-foreground"
                        : "bg-amber-500/20 text-amber-500"
                    }`}>
                      {s.costIncreasePercent === 0 ? "Atual (0%)" : `+${s.costIncreasePercent}% nos Insumos`}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      CMV: {formatCurrency(s.newDirectFoodCost, currency)}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground mt-1">
                    Novo Preço Sugerido: <strong className="font-black text-primary">{formatCurrency(s.suggestedPriceToKeepMargin, currency)}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Se congelar preço:</span>
                  <span className={`text-xs font-black ${s.profitLossIfPriceKeptFixed < 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(s.profitLossIfPriceKeptFixed, currency)} unit.
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-2xl text-[11px] text-primary flex items-start gap-2">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Dica de Grande Rede:</strong> Quando o preço do queijo ou da carne sobe mais de +10% no fornecedor, atualize o cardápio ou ajuste o tamanho da porção para não absorver prejuízo silencioso.
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE INSUMO DO ESTOQUE REAL */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-500">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {t.escandallo.stockModalTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.escandallo.stockModalDesc}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowStockModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full bg-black/5 dark:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Barra de Busca no Estoque */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-muted-foreground" size={16} />
              <input
                type="text"
                value={stockSearchTerm}
                onChange={e => setStockSearchTerm(e.target.value)}
                placeholder={t.escandallo.stockSearchPlaceholder}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Lista de Insumos Cadastrados no Estoque */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredStock.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p>{t.escandallo.noStockFound}</p>
                </div>
              ) : (
                filteredStock.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between hover:border-emerald-500/50 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-black text-foreground">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{t.escandallo.stockBatch} {item.lote || "S/L"}</span>
                        <span>•</span>
                        <span>{t.escandallo.stockAvailable} <strong>{item.quantity} {item.unit}</strong></span>
                        <span>•</span>
                        <span>{t.escandallo.stockCost} <strong>{formatCurrency(item.cost_price, currency)}/{item.unit}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddFromStock(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus size={13} /> {t.escandallo.selectStockBtn}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-foreground text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
