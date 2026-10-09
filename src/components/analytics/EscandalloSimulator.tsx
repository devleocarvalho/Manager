"use client";

import React, { useState, useMemo } from "react";
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
  HelpCircle
} from "lucide-react";
import { pricingService, PricingSimulationResult } from "../../services/pricingService";
import { RecipeIngredientCost, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";

interface EscandalloSimulatorProps {
  currency: CurrencyCode;
}

export function EscandalloSimulator({ currency }: EscandalloSimulatorProps) {
  const defaultRecipes = useMemo(() => pricingService.getDefaultRecipes(), []);
  
  const [selectedRecipeId, setSelectedRecipeId] = useState(defaultRecipes[0].id);
  const [dishName, setDishName] = useState(defaultRecipes[0].dishName);
  const [category, setCategory] = useState(defaultRecipes[0].category);
  const [currentSalePrice, setCurrentSalePrice] = useState<number>(defaultRecipes[0].currentSalePrice);
  const [targetMargin, setTargetMargin] = useState<number>(65); // 65% margem bruta alvo padrão
  const [overheadPercent, setOverheadPercent] = useState<number>(25); // 25% rateio de despesas fixas
  const [vatRate, setVatRate] = useState<number>(13); // IVA 13% restauração em Portugal
  const [ingredients, setIngredients] = useState<RecipeIngredientCost[]>(defaultRecipes[0].ingredients);

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

  // Adiciona novo insumo personalizado
  const addIngredient = () => {
    const newIng: RecipeIngredientCost = {
      ingredientId: `custom_${Date.now()}`,
      name: "Novo Insumo",
      purchasePackagePrice: 10.00,
      purchasePackageQty: 1,
      purchaseUnit: "kg",
      portionQty: 100,
      portionUnit: "g",
      portionCost: 1.00
    };
    setIngredients([...ingredients, newIng]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
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
                Engenharia de Custos & Escandallo Dinâmico
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cálculo de porção exata por matéria-prima, ponto de equilíbrio (zero prejuízo) e simulação de margens de lucro.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor de Pratos Padrão */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          {defaultRecipes.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelectRecipe(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRecipeId === r.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.dishName}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Resumo Financeiro & Ponto de Equilíbrio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CMV Direto */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
            1. CMV Direto (Insumos)
            <span className="text-[10px] text-primary font-semibold">100% Insumos</span>
          </span>
          <div className="text-2xl font-black text-foreground mt-1">
            {formatCurrency(breakdown.directFoodCost, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Soma exata das porções de cada ingrediente no prato.
          </p>
        </div>

        {/* Custo Total de Produção */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
            2. Custo Total Base
            <span className="text-[10px] text-amber-500 font-semibold">+{overheadPercent}% Overhead</span>
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {formatCurrency(breakdown.totalProductionCost, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            CMV + rateio de luz, gás, aluguel e salários de cozinha.
          </p>
        </div>

        {/* Preço de Equilíbrio (Break-Even com IVA) */}
        <div className={`p-4 rounded-3xl border shadow-sm ${
          isLoss 
            ? "bg-destructive/10 border-destructive/40 text-destructive" 
            : "bg-card border-border text-foreground"
        }`}>
          <span className="text-[11px] font-black uppercase flex items-center justify-between">
            3. Ponto de Equilíbrio
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">IVA {vatRate}%</span>
          </span>
          <div className="text-2xl font-black mt-1">
            {formatCurrency(breakdown.breakEvenPrice, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Preço mínimo de venda para ZERO lucro e ZERO prejuízo.
          </p>
        </div>

        {/* Preço Sugerido (Alvo {targetMargin}%) */}
        <div className="bg-success/10 border border-success/30 p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-success uppercase flex items-center justify-between">
            4. Preço Sugerido
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-success/20 text-success">
              Margem {targetMargin}%
            </span>
          </span>
          <div className="text-2xl font-black text-success mt-1">
            {formatCurrency(breakdown.suggestedSalePrice, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Garante lucro líquido unitário de <strong className="text-success">{formatCurrency(breakdown.suggestedSalePrice / (1 + vatRate/100) - breakdown.totalProductionCost, currency)}</strong>.
          </p>
        </div>
      </div>

      {/* Alerta de Lucratividade com Preço Atual */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        isLoss
          ? "bg-destructive/15 border-destructive text-destructive"
          : "bg-card border-border text-foreground"
      }`}>
        <div className="flex items-center gap-3">
          {isLoss ? <AlertTriangle size={24} className="shrink-0 text-destructive animate-bounce" /> : <CheckCircle2 size={24} className="shrink-0 text-success" />}
          <div>
            <h4 className="text-xs font-black uppercase">
              {isLoss 
                ? "⚠️ ALERTA DE PREJUÍZO: Preço Atual Abaixo do Custo Real!" 
                : "✅ Operação Saudável e Lucrativa"}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ao vender a <strong>{formatCurrency(currentSalePrice, currency)}</strong>, seu lucro líquido unitário é de{" "}
              <strong className={isLoss ? "text-destructive font-black" : "text-success font-black"}>
                {formatCurrency(breakdown.netProfitUnit, currency)}
              </strong> por prato servido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Preço Atual:</span>
          <input
            type="number"
            step="0.5"
            value={currentSalePrice}
            onChange={e => setCurrentSalePrice(parseFloat(e.target.value) || 0)}
            className="w-24 bg-card border border-border rounded-xl p-2 text-xs font-black text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela de Insumos & Escandallo Detalhado */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Layers size={16} className="text-primary" /> Ficha Técnica dos Insumos (Escandallo)
            </h3>
            <p className="text-xs text-muted-foreground">
              Ajuste preços de compra de atacado e quantidades da porção em tempo real.
            </p>
          </div>
          <button
            onClick={addIngredient}
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus size={14} /> + Insumo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                <th className="py-2.5">Insumo</th>
                <th className="py-2.5">Preço Compra Atacado</th>
                <th className="py-2.5">Embalagem Atacado</th>
                <th className="py-2.5">Porção no Prato</th>
                <th className="py-2.5 text-right">Custo da Porção</th>
                <th className="py-2.5 text-center">Ações</th>
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
                  <td className="py-2.5 text-right font-black text-sm text-foreground">
                    {formatCurrency(ing.portionCost, currency)}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover insumo"
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
            {marginTiers.map(t => (
              <div
                key={t.marginPercent}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  t.marginPercent === targetMargin
                    ? "bg-success/15 border-success/40 text-foreground shadow-sm"
                    : "bg-black/5 dark:bg-white/5 border-border text-foreground hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-12 text-center text-xs font-black px-2 py-1 rounded-xl ${
                    t.marginPercent === targetMargin ? "bg-success text-white" : "bg-black/10 dark:bg-white/10 text-muted-foreground"
                  }`}>
                    {t.marginPercent}%
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">
                      Preço Venda: <strong className="text-sm font-black">{formatCurrency(t.salePriceWithVat, currency)}</strong>
                    </h5>
                    <span className="text-[10px] text-muted-foreground">
                      Líquido sem IVA: {formatCurrency(t.salePriceNet, currency)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-success block">
                    +{formatCurrency(t.netProfitUnit, currency)} lucro
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
    </div>
  );
}
