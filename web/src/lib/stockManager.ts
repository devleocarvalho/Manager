import { collection, query, where, getDocs, updateDoc, doc, addDoc, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Tipo para a Ficha Técnica
export interface TechnicalSheetItem {
  ingredientId: string; // ID do ingrediente ou nome base
  ingredientName: string;
  quantityNeeded: number;
}

export interface TechnicalSheet {
  id?: string;
  menuItemId: string;
  menuItemName: string;
  items: TechnicalSheetItem[];
}

export async function processSaleDeduction(tenantId: string, menuItemName: string, quantitySold: number) {
  const alerts: string[] = [];

  // 1. Buscar a Ficha Técnica do Produto
  const sheetQuery = query(
    collection(db, "technical_sheets"),
    where("tenant_id", "==", tenantId),
    where("menuItemName", "==", menuItemName)
  );
  const sheetSnap = await getDocs(sheetQuery);

  if (sheetSnap.empty) {
    alerts.push(`⚠️ Ficha técnica não encontrada para: ${menuItemName}. Estoque não foi descontado.`);
    return alerts;
  }

  const sheet = sheetSnap.docs[0].data() as TechnicalSheet;

  // 2. Para cada ingrediente na ficha técnica, encontrar lotes e dar baixa FEFO
  for (const item of sheet.items) {
    const totalNeeded = item.quantityNeeded * quantitySold;
    let remainingToDeduct = totalNeeded;

    // Buscar lotes do ingrediente no estoque, ordenados pela validade (FEFO)
    const invQuery = query(
      collection(db, "inventory_items"),
      where("tenant_id", "==", tenantId),
      where("name", "==", item.ingredientName),
      orderBy("days_to_expire", "asc")
    );

    const invSnap = await getDocs(invQuery);

    if (invSnap.empty) {
      alerts.push(`🚨 Falta de estoque crítico: ${item.ingredientName} não encontrado no estoque.`);
      continue;
    }

    for (const invDoc of invSnap.docs) {
      if (remainingToDeduct <= 0) break;

      const invData = invDoc.data();
      const currentQty = Number(invData.quantity); // Assumindo que quantity está em número, ou tem que fazer parse se tiver "kg" ou "g"

      if (currentQty <= 0) continue;

      const deductAmount = Math.min(currentQty, remainingToDeduct);
      const newQty = currentQty - deductAmount;
      remainingToDeduct -= deductAmount;

      // Atualizar o banco
      await updateDoc(doc(db, "inventory_items", invDoc.id), {
        quantity: newQty
      });

      // Gerar alerta com localizador
      alerts.push(`✅ Usado ${deductAmount} de ${item.ingredientName} do Lote #${invData.lote}. Onde achar: ${invData.locator || 'Não especificado'}.`);
    }

    if (remainingToDeduct > 0) {
      alerts.push(`🚨 Estoque insuficiente para ${item.ingredientName}. Faltou baixar ${remainingToDeduct}.`);
    }
  }

  // Gravar a transação financeira da venda para refletir no Dashboard
  // Simulando que o preço seria repassado aqui, mas vamos apenas logar um evento de venda se quisermos.
  // ...

  return alerts;
}
