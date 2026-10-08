import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { FinancialTransaction } from "../domain/types";

export const financeService = {
  /**
   * Registra transação financeira (receita ou despesa) com suporte a valor de IVA
   */
  async addTransaction(tx: FinancialTransaction) {
    return await addDoc(collection(db, "financial_transactions"), {
      ...tx,
      date: tx.date || new Date().toISOString()
    });
  },

  /**
   * Escuta fluxo financeiro em tempo real
   */
  subscribeTransactions(tenantId: string, onUpdate: (txs: FinancialTransaction[]) => void) {
    if (!tenantId) return () => {};

    const q = query(
      collection(db, "financial_transactions"),
      where("tenant_id", "==", tenantId)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction));
      onUpdate(list);
    });
  }
};
