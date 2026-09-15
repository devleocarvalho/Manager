import { collection, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export interface TechnicalSheetItem {
  ingredientId: string;
  ingredientName: string;
  quantityNeeded: number;
  unit?: string;
  unitCost?: number;
}

export interface TechnicalSheet {
  id?: string;
  menuItemId: string;
  menuItemName: string;
  category?: string;
  salePrice?: number;
  estimatedPrepMinutes?: number;
  estimatedCost?: number;
  items: TechnicalSheetItem[];
}

/**
 * Realiza a dedução inteligente de estoque (FEFO - Primeiro que vence é o primeiro que sai)
 * 1. Primeiro verifica se o produto vendido possui uma Ficha Técnica (composição de insumos)
 * 2. Se não possuir ficha técnica, tenta deduzir diretamente o item unitário do estoque (ex: latas, sucos)
 */
export async function processSaleDeduction(tenantId: string, menuItemName: string, quantitySold: number) {
  const alerts: string[] = [];

  try {
    // 1. Buscar a Ficha Técnica do Produto
    const sheetQuery = query(
      collection(db, "technical_sheets"),
      where("tenant_id", "==", tenantId),
      where("menuItemName", "==", menuItemName)
    );
    const sheetSnap = await getDocs(sheetQuery);

    if (!sheetSnap.empty) {
      const sheet = sheetSnap.docs[0].data() as TechnicalSheet;

      // Dedução de cada insumo da Ficha Técnica via FEFO
      for (const item of sheet.items) {
        const totalNeeded = Number(item.quantityNeeded) * quantitySold;
        let remainingToDeduct = totalNeeded;

        // Buscar lotes do insumo ordenados por dias para vencer (FEFO)
        const invQuery = query(
          collection(db, "inventory_items"),
          where("tenant_id", "==", tenantId),
          orderBy("days_to_expire", "asc")
        );

        const invSnap = await getDocs(invQuery);
        // Filtro flexível por nome (case-insensitive)
        const matchingDocs = invSnap.docs.filter(d => 
          (d.data().name || "").toLowerCase().trim() === item.ingredientName.toLowerCase().trim()
        );

        if (matchingDocs.length === 0) {
          alerts.push(`🚨 Falta de estoque crítico: ${item.ingredientName} não encontrado no estoque.`);
          continue;
        }

        for (const invDoc of matchingDocs) {
          if (remainingToDeduct <= 0) break;

          const invData = invDoc.data();
          const currentQty = Number(invData.quantity) || 0;

          if (currentQty <= 0) continue;

          const deductAmount = Math.min(currentQty, remainingToDeduct);
          const newQty = Number((currentQty - deductAmount).toFixed(3));
          remainingToDeduct -= deductAmount;

          await updateDoc(doc(db, "inventory_items", invDoc.id), {
            quantity: newQty
          });

          alerts.push(`✅ Usado ${deductAmount} ${item.unit || 'un'} de ${item.ingredientName} (Lote #${invData.lote || 'N/A'}).`);
        }

        if (remainingToDeduct > 0) {
          alerts.push(`🚨 Estoque insuficiente para ${item.ingredientName}. Faltou baixar ${remainingToDeduct} ${item.unit || 'un'}.`);
        }
      }

      return alerts;
    }

    // 2. Se não encontrou ficha técnica, verificar se o produto existe diretamente no estoque (ex: Bebida, Sobremesa)
    const directInvQuery = query(
      collection(db, "inventory_items"),
      where("tenant_id", "==", tenantId),
      orderBy("days_to_expire", "asc")
    );
    const directSnap = await getDocs(directInvQuery);
    const directMatches = directSnap.docs.filter(d => 
      (d.data().name || "").toLowerCase().trim() === menuItemName.toLowerCase().trim()
    );

    if (directMatches.length > 0) {
      let remainingDirect = quantitySold;
      for (const invDoc of directMatches) {
        if (remainingDirect <= 0) break;

        const invData = invDoc.data();
        const currentQty = Number(invData.quantity) || 0;
        if (currentQty <= 0) continue;

        const deductAmount = Math.min(currentQty, remainingDirect);
        const newQty = currentQty - deductAmount;
        remainingDirect -= deductAmount;

        await updateDoc(doc(db, "inventory_items", invDoc.id), {
          quantity: newQty
        });

        alerts.push(`✅ Baixa direta: ${deductAmount} un de ${menuItemName} (Lote #${invData.lote || 'N/A'}).`);
      }
      return alerts;
    }

    alerts.push(`ℹ️ Produto "${menuItemName}" não tem ficha técnica nem lote cadastrado no estoque.`);
    return alerts;

  } catch (error) {
    console.error("Erro na dedução de estoque:", error);
    alerts.push(`⚠️ Falha ao atualizar estoque de ${menuItemName}.`);
    return alerts;
  }
}
