import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { TableItem, ComandaItem, MenuItem, CourseStage, MarchingStatus } from "../domain/types";
import { orderService } from "./orderService";
import { stockService } from "./stockService";
import { financeService } from "./financeService";

export const tableService = {
  subscribeTables(tenantId: string, onUpdate: (tables: TableItem[]) => void) {
    if (!tenantId) return () => {};

    const q = query(collection(db, "tables"), where("tenant_id", "==", tenantId));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Inicializa 24 mesas distribuídas por setores (Salão, Esplanada, Balcão)
        const initialTables: TableItem[] = [];
        for (let i = 1; i <= 24; i++) {
          const tableDocId = `${tenantId}_mesa-${i}`;
          let area = "Salão";
          let cap = 4;
          if (i > 12 && i <= 20) {
            area = "Esplanada";
            cap = (i % 2 === 0) ? 4 : 2;
          } else if (i > 20) {
            area = "Balcão";
            cap = 2;
          } else {
            cap = (i <= 4) ? 2 : (i <= 10) ? 4 : 6;
          }

          const t: TableItem = {
            id: tableDocId,
            number: i,
            name: `${area === "Balcão" ? "Lugar" : "Mesa"} ${i < 10 ? '0' + i : i}`,
            capacity: cap,
            status: "livre",
            area,
            items: [],
            totalAmount: 0
          };
          initialTables.push(t);
          await setDoc(doc(db, "tables", tableDocId), { ...t, tenant_id: tenantId });
        }
        onUpdate(initialTables);
      } else {
        const list: TableItem[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TableItem));
        list.sort((a, b) => a.number - b.number);
        onUpdate(list);
      }
    });
  },

  async createTable(tenantId: string, number: number, name: string, capacity: number, area = "Salão") {
    const tableId = `${tenantId}_mesa-${number}`;
    await setDoc(doc(db, "tables", tableId), {
      tenant_id: tenantId,
      id: tableId,
      number,
      name: name.trim() || `Mesa ${number < 10 ? '0' + number : number}`,
      capacity: Number(capacity) || 4,
      status: "livre",
      area,
      items: [],
      totalAmount: 0
    });
  },

  async addBatchMoreTables(tenantId: string, currentCount: number, countToAdd: number = 6, area = "Salão") {
    for (let i = 1; i <= countToAdd; i++) {
      const nextNum = currentCount + i;
      await this.createTable(tenantId, nextNum, `Mesa ${nextNum < 10 ? '0' + nextNum : nextNum}`, 4, area);
    }
  },

  async openTable(tableId: string, customerName: string, customerPhone = "", customerNif = "") {
    const updateData = {
      status: "ocupada" as const,
      customerName: customerName.trim() || "Cliente Salão",
      customerPhone: customerPhone.trim(),
      customerNif: customerNif.trim(),
      openedAt: new Date().toISOString(),
      items: [],
      totalAmount: 0
    };
    await updateDoc(doc(db, "tables", tableId), updateData);
    return updateData;
  },

  async addItemToTable(
    tableId: string, 
    currentItems: ComandaItem[], 
    menuItem: MenuItem, 
    notes = "",
    courseStage?: CourseStage
  ) {
    let stage: CourseStage = courseStage || "principal";
    if (!courseStage) {
      if (menuItem.category === "entradas") stage = "entrada";
      else if (menuItem.category === "bebidas") stage = "bebida";
      else if (menuItem.category === "sobremesas") stage = "sobremesa";
    }

    const newItem: ComandaItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: 1,
      category: menuItem.category,
      notes: notes.trim(),
      sentToKitchen: false,
      addedAt: new Date().toISOString(),
      vatRate: menuItem.vatRate || 13,
      courseStage: stage,
      marchingStatus: stage === "entrada" || stage === "bebida" ? "marchar" : "aguardar"
    };

    const updatedItems = [...(currentItems || []), newItem];
    const newTotal = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0);

    await updateDoc(doc(db, "tables", tableId), {
      items: updatedItems,
      totalAmount: newTotal
    });

    return { items: updatedItems, totalAmount: newTotal };
  },

  async toggleMarchItem(tableId: string, currentItems: ComandaItem[], itemId: string) {
    const updatedItems = currentItems.map(it => {
      if (it.id === itemId) {
        return { 
          ...it, 
          marchingStatus: (it.marchingStatus === "marchar" ? "aguardar" : "marchar") as MarchingStatus 
        };
      }
      return it;
    });

    await updateDoc(doc(db, "tables", tableId), { items: updatedItems });
    return updatedItems;
  },

  async removeItemFromTable(tableId: string, currentItems: ComandaItem[], itemId: string) {
    const updatedItems = currentItems.filter(i => i.id !== itemId);
    const newTotal = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0);

    await updateDoc(doc(db, "tables", tableId), {
      items: updatedItems,
      totalAmount: newTotal
    });

    return { items: updatedItems, totalAmount: newTotal };
  },

  async callWaiter(tenantId: string, tableNumber: number) {
    const tableId = `${tenantId}_mesa-${tableNumber}`;
    await updateDoc(doc(db, "tables", tableId), {
      status: "chamando_garcom",
      waiterCalledAt: new Date().toISOString()
    });
  },

  async addItemsFromQrCode(
    tenantId: string,
    tableNumber: number,
    newItems: ComandaItem[],
    customerName = ""
  ) {
    const tableId = `${tenantId}_mesa-${tableNumber}`;
    const tableRef = doc(db, "tables", tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;
    
    const tableData = snap.data() as TableItem;
    const currentItems = tableData.items || [];
    const updatedItems = [...currentItems, ...newItems];
    const newTotal = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0);

    const updateData: any = {
      items: updatedItems,
      totalAmount: newTotal,
      status: tableData.status === "livre" ? "ocupada" : tableData.status
    };
    if (tableData.status === "livre" || !tableData.customerName) {
      updateData.customerName = customerName || `Mesa ${tableNumber}`;
      updateData.openedAt = tableData.openedAt || new Date().toISOString();
    }

    await updateDoc(tableRef, updateData);
  },

  async sendToKitchen(tenantId: string, table: TableItem) {
    const unsent = table.items.filter(i => !i.sentToKitchen);
    if (unsent.length === 0) return 0;

    const orderNumber = Math.floor(100 + Math.random() * 900);
    const estMinutes = 10;

    await orderService.createOrder({
      tenant_id: tenantId,
      order_number: orderNumber,
      customer_name: `${table.name} (${table.customerName || 'Mesa'})`,
      table_number: table.number,
      order_type: "local",
      payment_method: "comanda_mesa",
      items: unsent.map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        price: i.price,
        notes: i.notes || "",
        courseStage: i.courseStage || "principal",
        marchingStatus: i.marchingStatus || "marchar"
      })),
      total_price: unsent.reduce((s, i) => s + (i.price * i.quantity), 0),
      status: "pendente",
      estimated_minutes: estMinutes,
      created_at: new Date().toISOString()
    });

    const updatedItems = table.items.map(i => ({ ...i, sentToKitchen: true }));
    await updateDoc(doc(db, "tables", table.id), { items: updatedItems });

    return estMinutes;
  },

  async closeBill(
    tenantId: string, 
    table: TableItem, 
    finalAmount: number, 
    paymentMethod: string,
    vatAmount: number = 0
  ) {
    // 1. Registra no Financeiro
    await financeService.addTransaction({
      tenant_id: tenantId,
      type: "income",
      category: "sales",
      amount: finalAmount,
      vat_amount: vatAmount,
      description: `Fecho ${table.name} - ${table.customerName || 'Cliente'} (${paymentMethod.toUpperCase()})`,
      payment_method: paymentMethod,
      date: new Date().toISOString()
    });

    // 2. Baixa FEFO de estoque
    for (const item of table.items) {
      try {
        await stockService.processSaleDeduction(tenantId, item.name, item.quantity);
      } catch (e) {
        console.warn("Baixa estoque:", e);
      }
    }

    // 3. Reseta mesa
    const resetData = {
      status: "livre" as const,
      customerName: "",
      customerPhone: "",
      customerNif: "",
      openedAt: "",
      items: [],
      totalAmount: 0,
      waiterCalledAt: ""
    };

    await updateDoc(doc(db, "tables", table.id), resetData);
    return true;
  }
};
