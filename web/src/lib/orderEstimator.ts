export interface ItemPrepInfo {
  basePrepMinutes: number;
  category: "lanches" | "combos" | "bebidas" | "porcoes" | "sobremesas";
  isFastItem: boolean;
}

// Tempo base de produção individual por produto (em minutos) padrão
export const ITEM_PREP_TIMES: Record<string, ItemPrepInfo> = {
  "Smash Burger Duplo": { basePrepMinutes: 6, category: "lanches", isFastItem: false },
  "Mega Bacon Crispy": { basePrepMinutes: 8, category: "lanches", isFastItem: false },
  "Cheese Chicken Salada": { basePrepMinutes: 7, category: "lanches", isFastItem: false },
  "Combo Smash + Batata + Refri": { basePrepMinutes: 8, category: "combos", isFastItem: false },
  "Combo Mega Bacon Completo": { basePrepMinutes: 9, category: "combos", isFastItem: false },
  "Batata Frita Rústica (G)": { basePrepMinutes: 4, category: "porcoes", isFastItem: true },
  "Nuggets Crocantes (10 un)": { basePrepMinutes: 5, category: "porcoes", isFastItem: true },
  "Refrigerante Lata 350ml": { basePrepMinutes: 1, category: "bebidas", isFastItem: true },
  "Suco Natural de Laranja 500ml": { basePrepMinutes: 2, category: "bebidas", isFastItem: true },
  "Milkshake de Chocolate Belga": { basePrepMinutes: 3, category: "sobremesas", isFastItem: true },
};

/**
 * Avalia se o pedido é elegível para Fast-Track (saída ultra-rápida / bebidas / sobremesas / porções)
 */
export function isOrderFastTrack(
  items: Array<{ name: string; quantity: number; category?: string; estimatedPrepMinutes?: number }>
): boolean {
  if (!items || items.length === 0) return false;
  return items.every(item => {
    // Se explicitamente cadastrado como bebida/sobremesa/porção rápida
    if (item.category === "bebidas" || item.category === "sobremesas") return true;
    if (item.estimatedPrepMinutes && item.estimatedPrepMinutes <= 3) return true;

    const info = ITEM_PREP_TIMES[item.name];
    return info ? info.isFastItem : false;
  });
}

/**
 * Calcula o tempo estimado de produção de um pedido considerando:
 * 1. Tempo estimado cadastrado na Ficha Técnica ou tempo padrão do item
 * 2. Itens individuais feitos em paralelo na cozinha
 * 3. Carga atual da fila da cozinha
 */
export function calculateOrderEstimatedMinutes(
  items: Array<{ name: string; quantity: number; estimatedPrepMinutes?: number; category?: string }>,
  queueLength: number = 0
): number {
  if (!items || items.length === 0) return 5;

  let maxItemTime = 3;
  let totalQuantity = 0;

  items.forEach(item => {
    // Se o item tiver tempo vindo da ficha técnica cadastrada
    let itemBase = item.estimatedPrepMinutes;
    if (!itemBase) {
      const info = ITEM_PREP_TIMES[item.name];
      itemBase = info ? info.basePrepMinutes : (item.category === "bebidas" ? 1 : 7);
    }

    if (itemBase > maxItemTime) {
      maxItemTime = itemBase;
    }
    totalQuantity += item.quantity;
  });

  const quantityOverhead = totalQuantity > 3 ? Math.floor((totalQuantity - 3) * 0.8) : 0;
  const selfPrepTime = maxItemTime + quantityOverhead;

  // Fator de Fila: +2 min por lote à frente
  const kitchenCapacity = 2;
  const queueDelay = Math.ceil(queueLength / kitchenCapacity) * 2;

  const isFast = isOrderFastTrack(items);
  const totalEstimated = isFast ? selfPrepTime + Math.min(queueDelay, 1) : selfPrepTime + queueDelay;

  return Math.max(2, totalEstimated);
}