"use client";

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";

export interface SyncOutboxItem {
  id: string;
  collection: "orders" | "inventory_items" | "financial_transactions" | "technical_sheets";
  action: "create" | "update" | "delete";
  docId?: string;
  data: any;
  timestamp: string;
}

export interface ConnectivityState {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  mode: "cloud" | "offline_local";
}

const STORAGE_KEYS = {
  ORDERS: "meugerente_local_orders",
  INVENTORY: "meugerente_local_inventory",
  TRANSACTIONS: "meugerente_local_transactions",
  OUTBOX: "meugerente_sync_outbox",
  LAST_SYNC: "meugerente_last_sync_timestamp"
};

class SyncEngine {
  private channel: BroadcastChannel | null = null;
  private isOnline: boolean = true;
  private pendingOutbox: SyncOutboxItem[] = [];
  private connectivityListeners: Set<(state: ConnectivityState) => void> = new Set();
  private lastSyncTime: string | null = null;
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      this.loadOutbox();

      // BroadcastChannel para comunicação instantânea entre abas sem internet
      try {
        this.channel = new BroadcastChannel("meugerente_sync_bus");
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (e) {
        console.warn("BroadcastChannel not supported in this environment");
      }

      // Listeners de conectividade do navegador
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));

      // Inicia sincronização se estiver online
      if (this.isOnline) {
        this.flushOutbox();
      }
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notifyConnectivityChange();
    if (online) {
      this.flushOutbox();
    }
  }

  private loadOutbox() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OUTBOX);
      this.pendingOutbox = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this.pendingOutbox = [];
    }
  }

  private saveOutbox() {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(this.pendingOutbox));
    this.notifyConnectivityChange();
  }

  private notifyConnectivityChange() {
    const state: ConnectivityState = {
      isOnline: this.isOnline,
      pendingSyncCount: this.pendingOutbox.length,
      lastSyncTime: this.lastSyncTime,
      mode: this.isOnline && this.pendingOutbox.length === 0 ? "cloud" : "offline_local"
    };
    this.connectivityListeners.forEach(listener => listener(state));
  }

  public getConnectivityState(): ConnectivityState {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.pendingOutbox.length,
      lastSyncTime: this.lastSyncTime,
      mode: this.isOnline && this.pendingOutbox.length === 0 ? "cloud" : "offline_local"
    };
  }

  public onConnectivityChange(callback: (state: ConnectivityState) => void) {
    this.connectivityListeners.add(callback);
    callback(this.getConnectivityState());
    return () => {
      this.connectivityListeners.delete(callback);
    };
  }

  private broadcastLocalEvent(type: string, payload: any) {
    if (this.channel) {
      this.channel.postMessage({ type, payload, timestamp: new Date().toISOString() });
    }
  }

  private handleBroadcastMessage(data: any) {
    // Dispara evento no window para componentes reagirem localmente
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("meugerente_local_event", { detail: data }));
    }
  }

  // ==========================================
  // OPERAÇÕES HÍBRIDAS: PEDIDOS (ORDERS)
  // ==========================================
  public async createOrder(orderData: any): Promise<string> {
    const localId = `order-loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullOrder = {
      id: localId,
      ...orderData,
      created_at: orderData.created_at || new Date().toISOString(),
      sync_status: this.isOnline ? "synced" : "pending_sync"
    };

    // 1. Salvar no Storage Local
    this.saveLocalItem(STORAGE_KEYS.ORDERS, fullOrder);
    
    // 2. Transmitir localmente para todas as abas (KDS, PDV)
    this.broadcastLocalEvent("NEW_ORDER", fullOrder);

    // 3. Nuvem ou Fila de Sincronização
    if (this.isOnline) {
      try {
        const docRef = await addDoc(collection(db, "orders"), {
          ...orderData,
          local_id: localId
        });
        fullOrder.id = docRef.id;
        this.updateLocalItem(STORAGE_KEYS.ORDERS, localId, fullOrder);
        this.lastSyncTime = new Date().toISOString();
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
        }
      } catch (err) {
        console.warn("Erro ao salvar no Firestore, enfileirando para sincronização posterior:", err);
        this.queueOutbox("orders", "create", fullOrder);
      }
    } else {
      this.queueOutbox("orders", "create", fullOrder);
    }

    return fullOrder.id;
  }

  public async updateOrderStatus(orderId: string, status: string, additionalData: any = {}): Promise<void> {
    // 1. Atualizar Localmente
    this.updateLocalItem(STORAGE_KEYS.ORDERS, orderId, { status, ...additionalData });

    // 2. Broadcast local para a Cozinha e PDV
    this.broadcastLocalEvent("ORDER_STATUS_CHANGED", { orderId, status, ...additionalData });

    // 3. Atualizar no Firebase ou Outbox
    if (this.isOnline && !orderId.startsWith("order-loc-")) {
      try {
        await updateDoc(doc(db, "orders", orderId), {
          status,
          ...additionalData
        });
      } catch (err) {
        this.queueOutbox("orders", "update", { status, ...additionalData }, orderId);
      }
    } else {
      this.queueOutbox("orders", "update", { status, ...additionalData }, orderId);
    }
  }

  // ==========================================
  // OPERAÇÕES HÍBRIDAS: ESTOQUE (INVENTORY)
  // ==========================================
  public async addInventoryItem(itemData: any): Promise<string> {
    const localId = `inv-loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullItem = { id: localId, ...itemData };

    this.saveLocalItem(STORAGE_KEYS.INVENTORY, fullItem);
    this.broadcastLocalEvent("INVENTORY_UPDATED", fullItem);

    if (this.isOnline) {
      try {
        const docRef = await addDoc(collection(db, "inventory_items"), itemData);
        fullItem.id = docRef.id;
        this.updateLocalItem(STORAGE_KEYS.INVENTORY, localId, fullItem);
      } catch (err) {
        this.queueOutbox("inventory_items", "create", fullItem);
      }
    } else {
      this.queueOutbox("inventory_items", "create", fullItem);
    }

    return fullItem.id;
  }

  // ==========================================
  // OPERAÇÕES HÍBRIDAS: FINANCEIRO (TRANSACTIONS)
  // ==========================================
  public async addTransaction(txData: any): Promise<string> {
    const localId = `tx-loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullTx = { id: localId, ...txData };

    this.saveLocalItem(STORAGE_KEYS.TRANSACTIONS, fullTx);
    this.broadcastLocalEvent("TRANSACTION_ADDED", fullTx);

    if (this.isOnline) {
      try {
        const docRef = await addDoc(collection(db, "financial_transactions"), txData);
        fullTx.id = docRef.id;
        this.updateLocalItem(STORAGE_KEYS.TRANSACTIONS, localId, fullTx);
      } catch (err) {
        this.queueOutbox("financial_transactions", "create", fullTx);
      }
    } else {
      this.queueOutbox("financial_transactions", "create", fullTx);
    }

    return fullTx.id;
  }

  // ==========================================
  // FILA DE SINCRONIZAÇÃO (OUTBOX QUEUE)
  // ==========================================
  private queueOutbox(
    coll: SyncOutboxItem["collection"],
    action: SyncOutboxItem["action"],
    data: any,
    docId?: string
  ) {
    const item: SyncOutboxItem = {
      id: `sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collection: coll,
      action,
      data,
      docId,
      timestamp: new Date().toISOString()
    };
    this.pendingOutbox.push(item);
    this.saveOutbox();
  }

  public async flushOutbox(): Promise<number> {
    if (this.isSyncing || this.pendingOutbox.length === 0 || !this.isOnline) {
      return 0;
    }

    this.isSyncing = true;
    let syncedCount = 0;

    const remainingItems: SyncOutboxItem[] = [];

    for (const item of this.pendingOutbox) {
      try {
        if (item.action === "create") {
          const { id, sync_status, ...cleanData } = item.data;
          await addDoc(collection(db, item.collection), cleanData);
          syncedCount++;
        } else if (item.action === "update" && item.docId && !item.docId.startsWith("order-loc-")) {
          await updateDoc(doc(db, item.collection, item.docId), item.data);
          syncedCount++;
        }
      } catch (err) {
        console.error("Falha ao sincronizar item do outbox:", item, err);
        remainingItems.push(item);
      }
    }

    this.pendingOutbox = remainingItems;
    this.saveOutbox();
    this.lastSyncTime = new Date().toISOString();
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
    }
    this.isSyncing = false;
    this.notifyConnectivityChange();

    return syncedCount;
  }

  // ==========================================
  // STORAGE HELPERS
  // ==========================================
  public getLocalCollection(key: string): any[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  private saveLocalItem(key: string, item: any) {
    if (typeof window === "undefined") return;
    const list = this.getLocalCollection(key);
    list.unshift(item);
    localStorage.setItem(key, JSON.stringify(list));
  }

  private updateLocalItem(key: string, id: string, patch: any) {
    if (typeof window === "undefined") return;
    const list = this.getLocalCollection(key);
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, ...patch };
      }
      return item;
    });
    localStorage.setItem(key, JSON.stringify(updated));
  }
}

// Singleton Engine
export const syncEngine = new SyncEngine();