import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  addDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, OrderStatus } from "../domain/types";

export const orderService = {
  /**
   * Escuta os pedidos da Cozinha/Bar em tempo real
   */
  subscribeOrders(tenantId: string, onUpdate: (orders: Order[]) => void) {
    if (!tenantId) return () => {};

    const q = query(collection(db, "orders"), where("tenant_id", "==", tenantId));
    return onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Order));

      onUpdate(orders);
    });
  },

  /**
   * Cria um novo pedido na esteira de produção
   */
  async createOrder(orderData: Omit<Order, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      created_at: orderData.created_at || new Date().toISOString()
    });
    return docRef.id;
  },

  /**
   * Atualiza o status do pedido (preparando, pronto, entregue)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const updateData: any = { status };
    const now = new Date().toISOString();

    if (status === "preparando") updateData.started_at = now;
    if (status === "pronto") updateData.completed_at = now;
    if (status === "entregue") updateData.delivered_at = now;

    await updateDoc(doc(db, "orders", orderId), updateData);
  }
};
