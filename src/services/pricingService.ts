import { RecipeIngredientCost, DishCostBreakdown } from "../domain/types";

export interface PricingSimulationResult {
  breakdown: DishCostBreakdown;
  marginTiers: {
    marginPercent: number;
    salePriceNet: number;
    salePriceWithVat: number;
    netProfitUnit: number;
    isCurrent?: boolean;
  }[];
  inflationSensitivity: {
    costIncreasePercent: number;
    newDirectFoodCost: number;
    newTotalBaseCost: number;
    newBreakEvenPrice: number;
    suggestedPriceToKeepMargin: number;
    profitLossIfPriceKeptFixed: number;
  }[];
}

export const pricingService = {
  /**
   * Converte unidades para unidade base padrão (gramas, ml ou unidades)
   */
  toBaseUnit(qty: number, unit: "kg" | "g" | "l" | "ml" | "un"): { value: number; type: "weight" | "volume" | "count" } {
    switch (unit) {
      case "kg":
        return { value: qty * 1000, type: "weight" };
      case "g":
        return { value: qty, type: "weight" };
      case "l":
        return { value: qty * 1000, type: "volume" };
      case "ml":
        return { value: qty, type: "volume" };
      case "un":
      default:
        return { value: qty, type: "count" };
    }
  },

  /**
   * Calcula o custo exato da porção com base na embalagem/compra de atacado
   * Exemplo: Queijo €20.00 / 1kg -> Porção 50g = €1.00
   */
  calculatePortionCost(
    purchasePackagePrice: number,
    purchasePackageQty: number,
    purchaseUnit: "kg" | "g" | "l" | "ml" | "un",
    portionQty: number,
    portionUnit: "kg" | "g" | "l" | "ml" | "un"
  ): number {
    const pkg = this.toBaseUnit(purchasePackageQty, purchaseUnit);
    const portion = this.toBaseUnit(portionQty, portionUnit);

    if (pkg.type !== portion.type || pkg.value <= 0) {
      return 0;
    }

    const unitBasePrice = purchasePackagePrice / pkg.value;
    const cost = unitBasePrice * portion.value;
    return Math.round(cost * 10000) / 10000;
  },

  /**
   * Calcula o Escandallo completo com ponto de equilíbrio (Break-even),
   * rateio operacional e preços sugeridos por margem de lucro.
   */
  calculateDishBreakdown(
    dishName: string,
    category: string,
    ingredients: RecipeIngredientCost[],
    currentSalePrice: number,
    targetMarginPercent = 65,
    indirectOverheadPercent = 25,
    vatRate = 13
  ): DishCostBreakdown {
    // 1. CMV Direto
    const directFoodCost = ingredients.reduce((sum, ing) => sum + (ing.portionCost || 0), 0);

    // 2. Rateio Operacional (Overhead indireto: luz, gás, salários da cozinha, aluguel)
    const indirectOverheadCost = directFoodCost * (indirectOverheadPercent / 100);

    // 3. Custo Total de Produção Base
    const totalProductionCost = directFoodCost + indirectOverheadCost;

    // 4. Preço de Equilíbrio (Break-Even) sem prejuízo
    // Preço mínimo com IVA em que Lucro Líquido = €0.00
    const vatFactor = 1 - (vatRate / 100);
    const breakEvenPrice = vatFactor > 0 ? (totalProductionCost / vatFactor) : totalProductionCost;

    // 5. Preço de Venda Otimizado para Margem Alvo (ex: 65% sobre receita líquida)
    const marginFactor = Math.max(0.01, 1 - (targetMarginPercent / 100));
    const netSalePrice = totalProductionCost / marginFactor;
    const suggestedSalePrice = netSalePrice * (1 + (vatRate / 100));

    // 6. Lucro Líquido Unitário com Preço Atual
    const currentNetRevenue = currentSalePrice / (1 + (vatRate / 100));
    const netProfitUnit = currentNetRevenue - totalProductionCost;

    return {
      dishName,
      category,
      ingredients,
      directFoodCost: Math.round(directFoodCost * 100) / 100,
      indirectOverheadPercent,
      indirectOverheadCost: Math.round(indirectOverheadCost * 100) / 100,
      totalProductionCost: Math.round(totalProductionCost * 100) / 100,
      targetVatRate: vatRate,
      breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
      currentSalePrice: Math.round(currentSalePrice * 100) / 100,
      suggestedMarginPercent: targetMarginPercent,
      suggestedSalePrice: Math.round(suggestedSalePrice * 100) / 100,
      netProfitUnit: Math.round(netProfitUnit * 100) / 100
    };
  },

  /**
   * Gera a Simulação de Precificação com Escalas de Margem (50% a 75%)
   * e Análise de Sensibilidade à Inflação de Insumos (+10%, +20%, +30%)
   */
  generateFullSimulation(
    dishName: string,
    category: string,
    ingredients: RecipeIngredientCost[],
    currentSalePrice: number,
    targetMargin = 65,
    overheadPercent = 25,
    vatRate = 13
  ): PricingSimulationResult {
    const breakdown = this.calculateDishBreakdown(
      dishName,
      category,
      ingredients,
      currentSalePrice,
      targetMargin,
      overheadPercent,
      vatRate
    );

    const marginTiers = [50, 55, 60, 65, 70, 75].map(m => {
      const marginFactor = Math.max(0.01, 1 - (m / 100));
      const net = breakdown.totalProductionCost / marginFactor;
      const withVat = net * (1 + (vatRate / 100));
      const profit = net - breakdown.totalProductionCost;
      return {
        marginPercent: m,
        salePriceNet: Math.round(net * 100) / 100,
        salePriceWithVat: Math.round(withVat * 100) / 100,
        netProfitUnit: Math.round(profit * 100) / 100,
        isCurrent: m === targetMargin
      };
    });

    // Sensibilidade à variação de custos de fornecedor
    const inflationSensitivity = [0, 10, 20, 30].map(pct => {
      const costMultiplier = 1 + (pct / 100);
      const newDirect = breakdown.directFoodCost * costMultiplier;
      const newTotal = newDirect * (1 + (overheadPercent / 100));
      const newBreakEven = newTotal / (1 - (vatRate / 100));
      const newSuggested = (newTotal / (1 - (targetMargin / 100))) * (1 + (vatRate / 100));
      
      const currentNetRev = currentSalePrice / (1 + (vatRate / 100));
      const profitLossIfFixed = currentNetRev - newTotal;

      return {
        costIncreasePercent: pct,
        newDirectFoodCost: Math.round(newDirect * 100) / 100,
        newTotalBaseCost: Math.round(newTotal * 100) / 100,
        newBreakEvenPrice: Math.round(newBreakEven * 100) / 100,
        suggestedPriceToKeepMargin: Math.round(newSuggested * 100) / 100,
        profitLossIfPriceKeptFixed: Math.round(profitLossIfFixed * 100) / 100
      };
    });

    return {
      breakdown,
      marginTiers,
      inflationSensitivity
    };
  },

  /**
   * Catálogo de Receitas Padronizadas de Referência (Benchmark Europeu)
   */
  getDefaultRecipes(): {
    id: string;
    dishName: string;
    category: string;
    currentSalePrice: number;
    ingredients: RecipeIngredientCost[];
  }[] {
    return [
      {
        id: "burger_queijo_serra",
        dishName: "Hambúrguer Artesanal com Queijo da Serra",
        category: "Pratos",
        currentSalePrice: 12.50,
        ingredients: [
          {
            ingredientId: "pao_brioche",
            name: "Pão Brioche Tostado",
            purchasePackagePrice: 0.80,
            purchasePackageQty: 1,
            purchaseUnit: "un",
            portionQty: 1,
            portionUnit: "un",
            portionCost: 0.80
          },
          {
            ingredientId: "carne_angus",
            name: "Carne Bovina Black Angus (180g)",
            purchasePackagePrice: 14.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 180,
            portionUnit: "g",
            portionCost: 2.52
          },
          {
            ingredientId: "queijo_serra",
            name: "Queijo Curado da Serra da Estrela",
            purchasePackagePrice: 20.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 50,
            portionUnit: "g",
            portionCost: 1.00 // €20/kg * 50g = €1.00 exato!
          },
          {
            ingredientId: "bacon_fumado",
            name: "Bacon Fumado Crocante",
            purchasePackagePrice: 12.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 30,
            portionUnit: "g",
            portionCost: 0.36
          },
          {
            ingredientId: "molho_trufado",
            name: "Molho Especial de Trufas",
            purchasePackagePrice: 8.00,
            purchasePackageQty: 1,
            purchaseUnit: "l",
            portionQty: 25,
            portionUnit: "ml",
            portionCost: 0.20
          },
          {
            ingredientId: "batatas_rusticas",
            name: "Batata Rústica Acompanhamento",
            purchasePackagePrice: 2.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 150,
            portionUnit: "g",
            portionCost: 0.30
          }
        ]
      },
      {
        id: "francesinha_porto",
        dishName: "Francesinha Especial à Moda do Porto",
        category: "Pratos",
        currentSalePrice: 13.90,
        ingredients: [
          {
            ingredientId: "pao_forma",
            name: "Pão de Forma Artesanal",
            purchasePackagePrice: 1.50,
            purchasePackageQty: 10,
            purchaseUnit: "un",
            portionQty: 2,
            portionUnit: "un",
            portionCost: 0.30
          },
          {
            ingredientId: "bife_alcatra",
            name: "Bife de Alcatra Fresco (120g)",
            purchasePackagePrice: 15.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 120,
            portionUnit: "g",
            portionCost: 1.80
          },
          {
            ingredientId: "linguica_fresca",
            name: "Linguiça e Salsicha Fresca",
            purchasePackagePrice: 8.50,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 80,
            portionUnit: "g",
            portionCost: 0.68
          },
          {
            ingredientId: "queijo_flamengo",
            name: "Queijo Flamengo em Fatias",
            purchasePackagePrice: 10.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 100,
            portionUnit: "g",
            portionCost: 1.00
          },
          {
            ingredientId: "molho_francesinha",
            name: "Molho de Cerveja e Vinho do Porto",
            purchasePackagePrice: 5.00,
            purchasePackageQty: 1,
            purchaseUnit: "l",
            portionQty: 200,
            portionUnit: "ml",
            portionCost: 1.00
          },
          {
            ingredientId: "ovo_estrelado",
            name: "Ovo Estrelado",
            purchasePackagePrice: 2.40,
            purchasePackageQty: 12,
            purchaseUnit: "un",
            portionQty: 1,
            portionUnit: "un",
            portionCost: 0.20
          }
        ]
      },
      {
        id: "bacalhau_bras",
        dishName: "Bacalhau à Brás Tradicional",
        category: "Pratos",
        currentSalePrice: 14.50,
        ingredients: [
          {
            ingredientId: "bacalhau_desfiado",
            name: "Bacalhau Demolhado Desfiado (200g)",
            purchasePackagePrice: 16.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 200,
            portionUnit: "g",
            portionCost: 3.20
          },
          {
            ingredientId: "batata_palha",
            name: "Batata Palha Fina Artesanal",
            purchasePackagePrice: 4.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 100,
            portionUnit: "g",
            portionCost: 0.40
          },
          {
            ingredientId: "ovos_biologicos",
            name: "Ovos Biológicos Frescos (2 un)",
            purchasePackagePrice: 3.00,
            purchasePackageQty: 12,
            purchaseUnit: "un",
            portionQty: 2,
            portionUnit: "un",
            portionCost: 0.50
          },
          {
            ingredientId: "azeite_cebola",
            name: "Azeite Virgem Extra e Refogado",
            purchasePackagePrice: 8.00,
            purchasePackageQty: 1,
            purchaseUnit: "l",
            portionQty: 50,
            portionUnit: "ml",
            portionCost: 0.40
          },
          {
            ingredientId: "azeitonas_salsa",
            name: "Azeitonas Pretas e Salsa Picada",
            purchasePackagePrice: 6.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 20,
            portionUnit: "g",
            portionCost: 0.12
          }
        ]
      },
      {
        id: "pizza_margherita",
        dishName: "Pizza Margherita D.O.P.",
        category: "Pizzas",
        currentSalePrice: 10.50,
        ingredients: [
          {
            ingredientId: "massa_fermentacao",
            name: "Massa Artesanal Longa Fermentação",
            purchasePackagePrice: 0.60,
            purchasePackageQty: 1,
            purchaseUnit: "un",
            portionQty: 1,
            portionUnit: "un",
            portionCost: 0.60
          },
          {
            ingredientId: "tomate_san_marzano",
            name: "Molho Tomate San Marzano D.O.P.",
            purchasePackagePrice: 3.50,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 100,
            portionUnit: "g",
            portionCost: 0.35
          },
          {
            ingredientId: "mozzarella_fior",
            name: "Mozzarella Fior di Latte",
            purchasePackagePrice: 18.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 100,
            portionUnit: "g",
            portionCost: 1.80
          },
          {
            ingredientId: "manjericao_azeite",
            name: "Manjericão Fresco & Fio de Azeite",
            purchasePackagePrice: 15.00,
            purchasePackageQty: 1,
            purchaseUnit: "kg",
            portionQty: 15,
            portionUnit: "g",
            portionCost: 0.23
          }
        ]
      }
    ];
  }
};
