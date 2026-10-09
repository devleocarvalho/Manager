import { 
  collection, 
  query, 
  where, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { CashRegisterShift, ShiftType } from "../domain/types";

export const cashShiftService = {
  async getActiveShift(tenantId: string): Promise<CashRegisterShift | null> {
    if (!tenantId) return null;
    const q = query(
      collection(db, "cash_shifts"), 
      where("tenant_id", "==", tenantId),
      where("status", "==", "aberto")
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docData = snap.docs[0];
    return { id: docData.id, ...docData.data() } as CashRegisterShift;
  },

  async openShift(
    tenantId: string, 
    operatorName: string, 
    shiftType: ShiftType, 
    initialFloat: number
  ): Promise<CashRegisterShift> {
    const shiftId = `shift_${tenantId}_${Date.now()}`;
    const newShift: CashRegisterShift = {
      id: shiftId,
      tenant_id: tenantId,
      openedAt: new Date().toISOString(),
      status: "aberto",
      operatorName: operatorName.trim() || "Operador Principal",
      shiftType,
      initialFloat: Number(initialFloat) || 150.00,
      sangrias: [],
      suprimentos: [],
      expectedCash: Number(initialFloat) || 150.00,
      cardTotal: 0,
      mbwayTotal: 0,
      totalSales: 0
    };

    await setDoc(doc(db, "cash_shifts", shiftId), newShift);
    return newShift;
  },

  async addSangria(shiftId: string, currentShift: CashRegisterShift, amount: number, reason: string) {
    const newSangria = {
      amount: Number(amount),
      reason: reason.trim() || "Sangria para cofre",
      time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    };
    const updatedSangrias = [...currentShift.sangrias, newSangria];
    const newExpectedCash = currentShift.expectedCash - Number(amount);

    await updateDoc(doc(db, "cash_shifts", shiftId), {
      sangrias: updatedSangrias,
      expectedCash: newExpectedCash
    });
  },

  async addSuprimento(shiftId: string, currentShift: CashRegisterShift, amount: number, reason: string) {
    const newSuprimento = {
      amount: Number(amount),
      reason: reason.trim() || "Reforço de troco",
      time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    };
    const updatedSuprimentos = [...currentShift.suprimentos, newSuprimento];
    const newExpectedCash = currentShift.expectedCash + Number(amount);

    await updateDoc(doc(db, "cash_shifts", shiftId), {
      suprimentos: updatedSuprimentos,
      expectedCash: newExpectedCash
    });
  },

  async closeShift(
    shiftId: string, 
    currentShift: CashRegisterShift, 
    declaredCash: number, 
    notes?: string
  ): Promise<CashRegisterShift> {
    const diff = Number((Number(declaredCash) - currentShift.expectedCash).toFixed(2));
    const closedData = {
      status: "fechado" as const,
      closedAt: new Date().toISOString(),
      declaredCash: Number(declaredCash),
      difference: diff,
      notes: notes || ""
    };

    await updateDoc(doc(db, "cash_shifts", shiftId), closedData);
    return { ...currentShift, ...closedData };
  }
};
