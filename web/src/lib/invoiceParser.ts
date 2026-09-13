export interface RawInvoiceItem {
  id: string;
  originalDescription: string;
  normalizedName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SandwichCostUpdate {
  sandwichName: string;
  previousCost: number;
  newCost: number;
  variationPercentage: string;
  sellingPrice: number;
  newProfitMargin: string;
}

export interface ProcessedInvoiceResult {
  supplier: string;
  invoiceDate: string;
  totalInvoiceAmount: number;
  items: RawInvoiceItem[];
  costUpdates: SandwichCostUpdate[];
  integrationJson: any;
}

// Dicionário de Normalização / Mapeamento (De-Para Inteligente)
export const NORMALIZATION_RULES: Array<{ keywords: string[]; target: string }> = [
  { keywords: ["PAO", "BRIOCHE", "FRANCES", "HAMB", "BUN"], target: "Pão Brioche" },
  { keywords: ["CARNE", "MOIDA", "BOV", "ACEM", "BLEND", "HAMBURGUER", "BURGER"], target: "Blend Bovino (Carne)" },
  { keywords: ["QUEIJO", "CHEDDAR", "PRATO", "MUSSA", "TIROLEZ"], target: "Queijo Cheddar" },
  { keywords: ["BACON", "DEFUMADO", "MANTA", "FAT"], target: "Bacon Fatiado" },
  { keywords: ["BATATA", "CONG", "PALITO", "MCCAIN", "RUSTICA"], target: "Batata Congelada" },
  { keywords: ["REFRIG", "COCA", "GUARANA", "LATA", "SPRITE", "FANTA"], target: "Refrigerante Lata 350ml" },
  { keywords: ["SUCO", "LARANJA", "CITROS"], target: "Suco Natural de Laranja 500ml" },
  { keywords: ["EMBALAGEM", "TERMICA", "SACOLA", "CAIXA"], target: "Embalagem Térmica" },
  { keywords: ["OLEO", "FRITURA", "SOJA", "GORDURA"], target: "Óleo para Fritura" },
  { keywords: ["MOLHO", "MAIONESE", "BARBECUE", "KETCHUP"], target: "Molho Especial" },
];

export function normalizeProductName(rawName: string): string {
  const clean = rawName.toUpperCase();
  for (const rule of NORMALIZATION_RULES) {
    if (rule.keywords.some(kw => clean.includes(kw))) {
      return rule.target;
    }
  }
  // Se não encontrar regra, limpa espaços e capitaliza
  return rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1).toLowerCase();
}

// Fichas técnicas base para recálculo de custo
const SANDWICH_RECIPES: Record<string, { sellingPrice: number; ingredients: Array<{ name: string; qty: number; unit: string }> }> = {
  "Smash Burger Duplo": {
    sellingPrice: 28.90,
    ingredients: [
      { name: "Pão Brioche", qty: 1, unit: "un" },
      { name: "Blend Bovino (Carne)", qty: 2, unit: "un" }, // 2x carnes ou proporcional
      { name: "Queijo Cheddar", qty: 2, unit: "un" },
      { name: "Molho Especial", qty: 1, unit: "un" },
      { name: "Embalagem Térmica", qty: 1, unit: "un" }
    ]
  },
  "Mega Bacon Crispy": {
    sellingPrice: 34.50,
    ingredients: [
      { name: "Pão Brioche", qty: 1, unit: "un" },
      { name: "Blend Bovino (Carne)", qty: 2, unit: "un" },
      { name: "Bacon Fatiado", qty: 1, unit: "un" },
      { name: "Queijo Cheddar", qty: 1, unit: "un" },
      { name: "Embalagem Térmica", qty: 1, unit: "un" }
    ]
  },
  "Combo Smash + Batata + Refri": {
    sellingPrice: 42.90,
    ingredients: [
      { name: "Pão Brioche", qty: 1, unit: "un" },
      { name: "Blend Bovino (Carne)", qty: 2, unit: "un" },
      { name: "Queijo Cheddar", qty: 2, unit: "un" },
      { name: "Batata Congelada", qty: 1, unit: "un" },
      { name: "Refrigerante Lata 350ml", qty: 1, unit: "un" },
      { name: "Embalagem Térmica", qty: 1, unit: "un" }
    ]
  },
  "Batata Frita Rústica (G)": {
    sellingPrice: 18.00,
    ingredients: [
      { name: "Batata Congelada", qty: 1, unit: "un" },
      { name: "Óleo para Fritura", qty: 1, unit: "un" },
      { name: "Embalagem Térmica", qty: 1, unit: "un" }
    ]
  }
};

// Custos de referência anteriores dos insumos
const BASE_INGREDIENT_COSTS: Record<string, number> = {
  "Pão Brioche": 0.40,
  "Blend Bovino (Carne)": 2.50,
  "Queijo Cheddar": 0.80,
  "Bacon Fatiado": 1.50,
  "Batata Congelada": 1.80,
  "Refrigerante Lata 350ml": 2.20,
  "Embalagem Térmica": 0.50,
  "Óleo para Fritura": 0.40,
  "Molho Especial": 0.30
};

/**
 * Recalcula os custos dos lanches com base nos novos preços dos insumos da nota fiscal
 */
export function recalculateSandwichCosts(newItems: RawInvoiceItem[]): SandwichCostUpdate[] {
  // Mapa com novos custos dos insumos
  const currentPrices: Record<string, number> = { ...BASE_INGREDIENT_COSTS };
  newItems.forEach(item => {
    currentPrices[item.normalizedName] = item.unitPrice;
  });

  const updates: SandwichCostUpdate[] = [];

  Object.entries(SANDWICH_RECIPES).forEach(([sandwichName, recipe]) => {
    let previousTotalCost = 0;
    let newTotalCost = 0;

    recipe.ingredients.forEach(ing => {
      const prevPrice = BASE_INGREDIENT_COSTS[ing.name] || 1.0;
      const newPrice = currentPrices[ing.name] || prevPrice;

      previousTotalCost += prevPrice * ing.qty;
      newTotalCost += newPrice * ing.qty;
    });

    const diff = newTotalCost - previousTotalCost;
    const pct = previousTotalCost > 0 ? (diff / previousTotalCost) * 100 : 0;
    const sign = pct > 0 ? "+" : "";
    const profitMargin = recipe.sellingPrice > 0 
      ? (((recipe.sellingPrice - newTotalCost) / recipe.sellingPrice) * 100).toFixed(1) + "%" 
      : "0%";

    updates.push({
      sandwichName,
      previousCost: +previousTotalCost.toFixed(2),
      newCost: +newTotalCost.toFixed(2),
      variationPercentage: `${sign}${pct.toFixed(1)}%`,
      sellingPrice: recipe.sellingPrice,
      newProfitMargin: profitMargin
    });
  });

  return updates;
}

/**
 * Parser de XML de NF-e / NFC-e padrão nacional (SEFAZ)
 */
export function parseNFeXML(xmlContent: string): ProcessedInvoiceResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  // Nome do Fornecedor / Emitente
  const emit = xmlDoc.getElementsByTagName("emit")[0];
  const supplier = emit?.getElementsByTagName("xNome")[0]?.textContent || "Supermercado / Fornecedor Parceiro";

  const totalElem = xmlDoc.getElementsByTagName("ICMSTot")[0];
  const totalAmount = Number(totalElem?.getElementsByTagName("vNF")[0]?.textContent || 0);

  const detList = xmlDoc.getElementsByTagName("det");
  const items: RawInvoiceItem[] = [];

  for (let i = 0; i < detList.length; i++) {
    const prod = detList[i].getElementsByTagName("prod")[0];
    if (!prod) continue;

    const xProd = prod.getElementsByTagName("xProd")[0]?.textContent || `Item #${i + 1}`;
    const qCom = Number(prod.getElementsByTagName("qCom")[0]?.textContent || 1);
    const vUnCom = Number(prod.getElementsByTagName("vUnCom")[0]?.textContent || 0);
    const vProd = Number(prod.getElementsByTagName("vProd")[0]?.textContent || (qCom * vUnCom));

    items.push({
      id: String(i + 1),
      originalDescription: xProd,
      normalizedName: normalizeProductName(xProd),
      quantity: qCom,
      unitPrice: vUnCom,
      totalPrice: vProd
    });
  }

  const costUpdates = recalculateSandwichCosts(items);

  // Formata o JSON estruturado exatamente como solicitado
  const integrationJson = {
    estoque: items.map(it => ({
      produto: it.normalizedName,
      quantidade: it.quantity,
      valor_unitario: it.unitPrice,
      valor_total: it.totalPrice
    })),
    custo_lanches: costUpdates.map(cu => ({
      lanche: cu.sandwichName,
      custo: cu.newCost,
      custo_anterior: cu.previousCost,
      variacao: cu.variationPercentage,
      margem_lucro: cu.newProfitMargin
    }))
  };

  return {
    supplier,
    invoiceDate: new Date().toISOString(),
    totalInvoiceAmount: totalAmount || items.reduce((acc, it) => acc + it.totalPrice, 0),
    items,
    costUpdates,
    integrationJson
  };
}

// Presets de Cupom Fiscal para Teste em 1-Clique
export const SAMPLE_INVOICES: Array<{ label: string; supplier: string; items: Array<{ name: string; qty: number; unitPrice: number }> }> = [
  {
    label: "🛒 Atacadão dos Alimentos (Carnes, Pães e Queijo)",
    supplier: "Atacadão Distribuidora de Alimentos S.A.",
    items: [
      { name: "PAO HAMB BRIOCHE ARTESANAL 50UN", qty: 50, unitPrice: 0.45 },
      { name: "CARNE MOIDA BOV BLEND 180G KG", qty: 30, unitPrice: 2.80 },
      { name: "QUEIJO CHEDDAR FAT TIROLEZ 1KG", qty: 20, unitPrice: 1.10 },
      { name: "BACON DEFUMADO MANTA FAT KG", qty: 15, unitPrice: 1.65 },
      { name: "EMBALAGEM TERMICA BURGER CX 100UN", qty: 100, unitPrice: 0.48 }
    ]
  },
  {
    label: "🍟 Distribuidora de Fritas & Bebidas",
    supplier: "Distribuidora Express Bebidas & Congelados",
    items: [
      { name: "BATATA CONG MCCAIN RUSTICA PCT 2.5KG", qty: 25, unitPrice: 1.95 },
      { name: "REFRIG COCA COLA LATA 350ML FD 12UN", qty: 48, unitPrice: 2.30 },
      { name: "OLEO VEGETAL FRITURA ALTA TEMP 5L", qty: 10, unitPrice: 0.42 },
      { name: "SUCO NATURAL CITROS LARANJA GARRAFA", qty: 20, unitPrice: 3.50 }
    ]
  },
  {
    label: "🧀 Laticínios & Molhos Artesanais",
    supplier: "Laticínios & Queijaria Regional",
    items: [
      { name: "QUEIJO PRATO MUSSA FATIADA 500G", qty: 30, unitPrice: 0.95 },
      { name: "MOLHO MAIONESE DEFUMADA ESPECIAL 1L", qty: 10, unitPrice: 0.35 },
      { name: "PAO FRANC BRIOCHE PREMIUM", qty: 40, unitPrice: 0.42 }
    ]
  }
];

export function buildSampleInvoiceResult(sampleIndex: number): ProcessedInvoiceResult {
  const sample = SAMPLE_INVOICES[sampleIndex] || SAMPLE_INVOICES[0];
  const items: RawInvoiceItem[] = sample.items.map((it, idx) => ({
    id: String(idx + 1),
    originalDescription: it.name,
    normalizedName: normalizeProductName(it.name),
    quantity: it.qty,
    unitPrice: it.unitPrice,
    totalPrice: +(it.qty * it.unitPrice).toFixed(2)
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const costUpdates = recalculateSandwichCosts(items);

  const integrationJson = {
    estoque: items.map(it => ({
      produto: it.normalizedName,
      quantidade: it.quantity,
      valor_unitario: it.unitPrice,
      valor_total: it.totalPrice
    })),
    custo_lanches: costUpdates.map(cu => ({
      lanche: cu.sandwichName,
      custo: cu.newCost,
      custo_anterior: cu.previousCost,
      variacao: cu.variationPercentage,
      margem_lucro: cu.newProfitMargin
    }))
  };

  return {
    supplier: sample.supplier,
    invoiceDate: new Date().toISOString(),
    totalInvoiceAmount: +totalAmount.toFixed(2),
    items,
    costUpdates,
    integrationJson
  };
}