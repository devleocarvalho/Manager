import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  addDoc, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { TechnicalSheet, InventoryItem } from "../domain/types";

export const stockService = {
  /**
   * Escuta os itens de estoque do restaurante
   */
  subscribeStock(tenantId: string, onUpdate: (items: InventoryItem[]) => void) {
    if (!tenantId) return () => {};

    const q = query(
      collection(db, "inventory_items"), 
      where("tenant_id", "==", tenantId),
      orderBy("days_to_expire", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      onUpdate(list);
    });
  },

  /**
   * Adiciona novo lote de mercadoria no estoque
   */
  async addStockBatch(item: InventoryItem) {
    return await addDoc(collection(db, "inventory_items"), item);
  },

  /**
   * Realiza a dedução inteligente de estoque (FEFO - Primeiro que vence é o primeiro que sai)
   */
  async processSaleDeduction(tenantId: string, menuItemName: string, quantitySold: number) {
    const alerts: string[] = [];

    try {
      // 1. Busca ficha técnica da receita
      const sheetQuery = query(
        collection(db, "technical_sheets"),
        where("tenant_id", "==", tenantId),
        where("menuItemName", "==", menuItemName)
      );
      const sheetSnap = await getDocs(sheetQuery);

      if (!sheetSnap.empty) {
        const sheet = sheetSnap.docs[0].data() as TechnicalSheet;

        for (const item of sheet.items) {
          let totalNeeded = Number(item.quantityNeeded) * quantitySold;
          const recipeUnit = item.unit || "un";
          const invUnit = item.inventoryUnit || recipeUnit;

          // Conversão de unidades
          if (invUnit === "kg" && recipeUnit === "g") totalNeeded = totalNeeded / 1000;
          if (invUnit === "l" && recipeUnit === "ml") totalNeeded = totalNeeded / 1000;

          let remainingToDeduct = totalNeeded;

          const invQuery = query(
            collection(db, "inventory_items"),
            where("tenant_id", "==", tenantId),
            orderBy("days_to_expire", "asc")
          );
          const invSnap = await getDocs(invQuery);
          const matchingDocs = invSnap.docs.filter(d => 
            (d.data().name || "").toLowerCase().trim() === item.ingredientName.toLowerCase().trim()
          );

          if (matchingDocs.length === 0) {
            alerts.push(`Insumo ${item.ingredientName} não encontrado no estoque.`);
            continue;
          }

          for (const invDoc of matchingDocs) {
            if (remainingToDeduct <= 0) break;
            const currentQty = Number(invDoc.data().quantity) || 0;
            if (currentQty <= 0) continue;

            const deduct = Math.min(currentQty, remainingToDeduct);
            const newQty = Number((currentQty - deduct).toFixed(3));
            remainingToDeduct -= deduct;

            await updateDoc(doc(db, "inventory_items", invDoc.id), { quantity: newQty });
            alerts.push(`Baixa FEFO: ${deduct} ${invUnit} de ${item.ingredientName}.`);
          }
        }
        return alerts;
      }

      // 2. Se não tem ficha técnica, baixa direta do produto unitário (ex: cerveja lata, garrafa de água)
      const directQuery = query(
        collection(db, "inventory_items"),
        where("tenant_id", "==", tenantId),
        orderBy("days_to_expire", "asc")
      );
      const directSnap = await getDocs(directQuery);
      const directMatches = directSnap.docs.filter(d => 
        (d.data().name || "").toLowerCase().trim() === menuItemName.toLowerCase().trim()
      );

      if (directMatches.length > 0) {
        let remaining = quantitySold;
        for (const d of directMatches) {
          if (remaining <= 0) break;
          const curr = Number(d.data().quantity) || 0;
          if (curr <= 0) continue;

          const deduct = Math.min(curr, remaining);
          remaining -= deduct;
          await updateDoc(doc(db, "inventory_items", d.id), { quantity: curr - deduct });
          alerts.push(`Baixa direta: ${deduct} de ${menuItemName}.`);
        }
      }

      return alerts;
    } catch (e) {
      console.warn("Erro na dedução de estoque:", e);
      return [`Erro ao processar baixa de ${menuItemName}`];
    }
  }
};
