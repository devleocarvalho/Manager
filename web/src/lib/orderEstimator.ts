export interface ItemPrepInfo {
  basePrepMinutes: number;
  category: "lanches" | "combos" | "bebidas" | "porcoes" | "sobremesas";
  isFastItem: boolean;
}

// Tempo base de produção individual por produto (em minutos)
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
 * Avalia se o pedido é elegível para Fast-Track (saída ultra-rápida / sem chapa pesada)
 */
export function isOrderFastTrack(items: Array<{ name: string; quantity: number }>): boolean {
  if (!items || items.length === 0) return false;
  return items.every(item => {
    const info = ITEM_PREP_TIMES[item.name];
    return info ? info.isFastItem : false;
  });
}

/**
 * Calcula o tempo estimado de produção de um pedido considerando:
 * 1. Tempo máximo de preparo dos itens individuais (já que a cozinha monta em paralelo)
 * 2. Carga/Gargalo atual da fila na cozinha (pedidos à frente)
 * 
 * @param items Lista de itens do pedido
 * @param queueLength Quantidade de pedidos pendentes na fila da cozinha
 * @returns tempo estimado em minutos
 */
export function calculateOrderEstimatedMinutes(
  items: Array<{ name: string; quantity: number }>,
  queueLength: number = 0
): number {
  if (!items || items.length === 0) return 5;

  // 1. Tempo base pelo item mais demorado + incremento por quantidade
  let maxItemTime = 3;
  let totalQuantity = 0;

  items.forEach(item => {
    const info = ITEM_PREP_TIMES[item.name];
    const itemBase = info ? info.basePrepMinutes : 6;
    if (itemBase > maxItemTime) {
      maxItemTime = itemBase;
    }
    totalQuantity += item.quantity;
  });

  // Se tiver muitos itens no mesmo pedido, adiciona uma pequena fração
  const quantityOverhead = totalQuantity > 3 ? Math.floor((totalQuantity - 3) * 0.8) : 0;
  const selfPrepTime = maxItemTime + quantityOverhead;

  // 2. Fator de Fila da Cozinha:
  // Assumindo uma capacidade padrão de 2 chapas/bancadas trabalhando simultaneamente
  const kitchenCapacity = 2;
  const queueDelay = Math.ceil(queueLength / kitchenCapacity) * 3; // +3 min por lote à frente

  // Fast-track pula a fila da chapa se só tiver bebidas/porções rápidas
  const isFast = isOrderFastTrack(items);
  const totalEstimated = isFast ? selfPrepTime + Math.min(queueDelay, 2) : selfPrepTime + queueDelay;

  return Math.max(2, totalEstimated);
}