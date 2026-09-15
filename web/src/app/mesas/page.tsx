"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { SyncStatusBadge } from "../../components/SyncStatusBadge";
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Send, 
  Trash2, 
  Receipt, 
  ChevronRight, 
  Phone, 
  CreditCard, 
  QrCode, 
  Banknote,
  Sparkles,
  Coffee,
  X
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { syncEngine } from "../../lib/syncEngine";
import { processSaleDeduction } from "../../lib/stockManager";
import { calculateOrderEstimatedMinutes } from "../../lib/orderEstimator";
import { useAuth } from "../../context/AuthContext";

export interface ComandaItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  notes?: string;
  sentToKitchen: boolean;
  addedAt: string;
}

export interface TableItem {
  id: string; // "mesa-1", "mesa-2", etc.
  number: number;
  name: string;
  capacity: number;
  status: "livre" | "ocupada" | "fechamento";
  customerName?: string;
  customerPhone?: string;
  openedAt?: string;
  items: ComandaItem[];
  totalAmount: number;
}

const DEFAULT_MENU_ITEMS = [
  { id: "1", name: "Smash Burger Duplo", price: 28.90, category: "lanches" },
  { id: "2", name: "Mega Bacon Crispy", price: 34.50, category: "lanches" },
  { id: "3", name: "Cheese Chicken Salada", price: 26.00, category: "lanches" },
  { id: "4", name: "Combo Smash + Batata + Refri", price: 42.90, category: "combos" },
  { id: "5", name: "Combo Mega Bacon Completo", price: 49.90, category: "combos" },
  { id: "6", name: "Batata Frita Rústica (G)", price: 18.00, category: "porcoes" },
  { id: "7", name: "Nuggets Crocantes (10 un)", price: 20.00, category: "porcoes" },
  { id: "8", name: "Refrigerante Lata 350ml", price: 6.50, category: "bebidas" },
  { id: "9", name: "Suco Natural de Laranja 500ml", price: 9.00, category: "bebidas" },
  { id: "10", name: "Milkshake de Chocolate Belga", price: 16.00, category: "sobremesas" },
];

export default function MesasPage() {
  const { tenantId } = useAuth();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"todas" | "livres" | "ocupadas">("todas");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);
  const [showCloseBillModal, setShowCloseBillModal] = useState(false);

  // Cardápio unificado (Padrão + Fichas Técnicas cadastradas)
  const [menuItems, setMenuItems] = useState<any[]>(DEFAULT_MENU_ITEMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Estados de formulário
  const [newTableNumber, setNewTableNumber] = useState<number>(11);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");

  // Abertura de Mesa
  const [openCustomerName, setOpenCustomerName] = useState("");
  const [openCustomerPhone, setOpenCustomerPhone] = useState("");

  // Fechamento de Conta
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [closingBill, setClosingBill] = useState(false);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);

  // Inicializa e sincroniza mesas com o Firestore
  useEffect(() => {
    if (!tenantId) return;

    // 1. Carrega Fichas Técnicas para alimentar o catálogo de pedidos
    const unsubSheets = onSnapshot(
      query(collection(db, "technical_sheets"), where("tenant_id", "==", tenantId)),
      (snapshot) => {
        const customItems = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: `sheet-${d.id}`,
            name: data.menuItemName,
            price: Number(data.salePrice) || 25.00,
            category: data.category || "lanches",
            estimatedPrepMinutes: data.estimatedPrepMinutes || 8
          };
        });

        // Junta sem duplicar nomes
        const existingNames = new Set(customItems.map(c => c.name.toLowerCase()));
        const filteredDefault = DEFAULT_MENU_ITEMS.filter(d => !existingNames.has(d.name.toLowerCase()));
        setMenuItems([...customItems, ...filteredDefault]);
      }
    );

    // 2. Carrega Mesas do Tenant
    const q = query(collection(db, "tables"), where("tenant_id", "==", tenantId));
    const unsubTables = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Inicializa automaticamente Mesas de 1 a 10 isoladas para este tenant
        const initialTables: TableItem[] = [];
        for (let i = 1; i <= 10; i++) {
          const tableDocId = `${tenantId}_mesa-${i}`;
          const t: TableItem = {
            id: tableDocId,
            number: i,
            name: `Mesa ${i < 10 ? '0' + i : i}`,
            capacity: 4,
            status: "livre",
            items: [],
            totalAmount: 0
          };
          initialTables.push(t);
          await setDoc(doc(db, "tables", tableDocId), {
            ...t,
            tenant_id: tenantId
          });
        }
        setTables(initialTables);
      } else {
        const list: TableItem[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as TableItem));
        list.sort((a, b) => a.number - b.number);
        setTables(list);
        setNewTableNumber(list.length > 0 ? Math.max(...list.map(t => t.number)) + 1 : 11);

        // Se uma mesa estiver selecionada, atualiza seus dados na tela
        if (selectedTable) {
          const updated = list.find(t => t.id === selectedTable.id);
          if (updated) setSelectedTable(updated);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubSheets();
      unsubTables();
    };
  }, [tenantId, selectedTable?.id]);

  // Adicionar Nova Mesa
  const handleAddNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const num = Number(newTableNumber);
      const name = newTableName.trim() || `Mesa ${num < 10 ? '0' + num : num}`;
      const tableId = `${tenantId}_mesa-${num}`;

      await setDoc(doc(db, "tables", tableId), {
        tenant_id: tenantId,
        id: tableId,
        number: num,
        name,
        capacity: Number(newTableCapacity) || 4,
        status: "livre",
        items: [],
        totalAmount: 0
      });

      setShowAddTableModal(false);
      setNewTableName("");
      setNewTableNumber(num + 1);
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar nova mesa.");
    }
  };

  // Abrir Comanda para uma Mesa Livre
  const handleOpenTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    try {
      const updateData = {
        status: "ocupada" as const,
        customerName: openCustomerName.trim() || "Cliente Salão",
        customerPhone: openCustomerPhone.trim() || "",
        openedAt: new Date().toISOString(),
        items: [],
        totalAmount: 0
      };

      await updateDoc(doc(db, "tables", selectedTable.id), updateData);
      setSelectedTable({ ...selectedTable, ...updateData });
      setShowOpenTableModal(false);
      setOpenCustomerName("");
      setOpenCustomerPhone("");
    } catch (err) {
      console.error(err);
      alert("Erro ao abrir mesa.");
    }
  };

  // Adicionar item à comanda da mesa
  const handleAddItemToTable = async (item: any) => {
    if (!selectedTable || selectedTable.status === "livre") return;

    const newItem: ComandaItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      category: item.category,
      sentToKitchen: false,
      addedAt: new Date().toISOString()
    };

    const updatedItems = [...(selectedTable.items || []), newItem];
    const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    try {
      await updateDoc(doc(db, "tables", selectedTable.id), {
        items: updatedItems,
        totalAmount: newTotal
      });
      setSelectedTable({ ...selectedTable, items: updatedItems, totalAmount: newTotal });
    } catch (err) {
      console.error(err);
      alert("Erro ao lançar item.");
    }
  };

  // Remover item da comanda (apenas se ainda não foi para a cozinha)
  const handleRemoveItemFromTable = async (itemId: string) => {
    if (!selectedTable) return;
    const updatedItems = selectedTable.items.filter(i => i.id !== itemId);
    const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    try {
      await updateDoc(doc(db, "tables", selectedTable.id), {
        items: updatedItems,
        totalAmount: newTotal
      });
      setSelectedTable({ ...selectedTable, items: updatedItems, totalAmount: newTotal });
    } catch (err) {
      console.error(err);
      alert("Erro ao remover item.");
    }
  };

  // Enviar itens pendentes da comanda para a Cozinha (KDS)
  const handleSendToKitchen = async () => {
    if (!selectedTable) return;
    const unsentItems = selectedTable.items.filter(i => !i.sentToKitchen);
    if (unsentItems.length === 0) {
      alert("Todos os itens já foram enviados para a cozinha!");
      return;
    }

    setSendingToKitchen(true);
    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);
      const estMinutes = calculateOrderEstimatedMinutes(
        unsentItems.map(i => ({ name: i.name, quantity: i.quantity })),
        0
      );

      // 1. Cria o pedido na esteira da Cozinha
      await syncEngine.createOrder({
        tenant_id: tenantId,
        order_number: orderNumber,
        customer_name: `${selectedTable.name} (${selectedTable.customerName || 'Salão'})`,
        order_type: "local",
        payment_method: "comanda_mesa",
        items: unsentItems.map(i => ({
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes || ""
        })),
        total_price: unsentItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        status: "pendente",
        estimated_minutes: estMinutes,
        created_at: new Date().toISOString()
      });

      // 2. Marca os itens como enviados na comanda
      const updatedItems = selectedTable.items.map(i => ({
        ...i,
        sentToKitchen: true
      }));

      await updateDoc(doc(db, "tables", selectedTable.id), {
        items: updatedItems
      });

      setSelectedTable({ ...selectedTable, items: updatedItems });
      alert(`✅ Pedido da ${selectedTable.name} enviado para a Cozinha! Previsão: ~${estMinutes} min.`);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar pedido para a cozinha.");
    } finally {
      setSendingToKitchen(false);
    }
  };

  // Fechamento de Conta da Mesa
  const handleCloseBill = async () => {
    if (!selectedTable) return;
    setClosingBill(true);

    try {
      const subtotal = selectedTable.totalAmount;
      const discount = Number(discountAmount) || 0;
      const finalAmount = Math.max(0, subtotal - discount);

      // 1. Registra no Financeiro
      await syncEngine.addTransaction({
        tenant_id: tenantId,
        type: "income",
        category: "sales",
        amount: finalAmount,
        description: `Fechamento ${selectedTable.name} - ${selectedTable.customerName || 'Cliente'} (${paymentMethod.toUpperCase()})`,
        date: new Date().toISOString()
      });

      // 2. Baixa FEFO dos insumos de todos os itens da comanda
      for (const item of selectedTable.items) {
        try {
          await processSaleDeduction(tenantId, item.name, item.quantity);
        } catch (e) {
          console.warn("Erro ao deduzir insumos:", e);
        }
      }

      // 3. Reseta a mesa para LIVRE
      const resetData = {
        status: "livre" as const,
        customerName: "",
        customerPhone: "",
        openedAt: "",
        items: [],
        totalAmount: 0
      };

      await updateDoc(doc(db, "tables", selectedTable.id), resetData);
      setSelectedTable(null);
      setShowCloseBillModal(false);
      setDiscountAmount("0");
      alert(`🎉 Conta da ${selectedTable.name} encerrada com sucesso! R$ ${finalAmount.toFixed(2)} recebido.`);
    } catch (err) {
      console.error(err);
      alert("Erro ao fechar conta.");
    } finally {
      setClosingBill(false);
    }
  };

  // Métricas do Painel
  const totalMesas = tables.length;
  const mesasOcupadas = tables.filter(t => t.status === "ocupada" || t.status === "fechamento").length;
  const mesasLivres = tables.filter(t => t.status === "livre").length;
  const faturamentoEmAberto = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // Filtro
  const filteredTables = tables.filter(t => {
    if (filterStatus === "livres") return t.status === "livre";
    if (filterStatus === "ocupadas") return t.status !== "livre";
    return true;
  });

  // Filtro do cardápio para adicionar na comanda
  const filteredCatalog = menuItems.filter(item => {
    const matchesCat = selectedCategory === "todos" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                <UtensilsCrossed size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Gestão de Mesas & Comandas
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Atendimento por mesa, pedidos dinâmicos, envio para a cozinha e fechamento ágil.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SyncStatusBadge />
            <button 
              onClick={() => setShowAddTableModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25 active:scale-95"
            >
              <Plus size={16} />
              + Nova Mesa
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Métricas do Salão */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Mesas Cadastradas</span>
            <div className="text-2xl font-black text-foreground mt-1">{totalMesas}</div>
            <p className="text-[10px] text-muted-foreground">Capacidade do salão</p>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-bold text-amber-500 uppercase">Mesas Ocupadas</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{mesasOcupadas}</div>
            <p className="text-[10px] text-muted-foreground">Comandas em atendimento</p>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-bold text-success uppercase">Mesas Livres</span>
            <div className="text-2xl font-black text-success mt-1">{mesasLivres}</div>
            <p className="text-[10px] text-muted-foreground">Prontas para receber</p>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-bold text-primary uppercase">Consumo em Aberto</span>
            <div className="text-2xl font-black text-primary mt-1">
              R$ {faturamentoEmAberto.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground">Total a ser faturado</p>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border">
            <button 
              onClick={() => setFilterStatus("todas")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "todas" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas ({totalMesas})
            </button>
            <button 
              onClick={() => setFilterStatus("ocupadas")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "ocupadas" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ocupadas ({mesasOcupadas})
            </button>
            <button 
              onClick={() => setFilterStatus("livres")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "livres" ? "bg-success text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Livres ({mesasLivres})
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            Clique sobre qualquer mesa para abrir comanda, lançar itens ou fechar a conta.
          </div>
        </div>

        {/* Grid Visual de Mesas */}
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">
            Carregando mesas do estabelecimento...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTables.map(table => {
              const isOccupied = table.status !== "livre";
              const unsentCount = table.items?.filter(i => !i.sentToKitchen).length || 0;

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    if (table.status === "livre") {
                      setShowOpenTableModal(true);
                    }
                  }}
                  className={`relative p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between min-h-[160px] ${
                    isOccupied 
                      ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-500" 
                      : "bg-card border-border hover:border-success/60 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                        isOccupied ? "bg-amber-500 text-white" : "bg-success/20 text-success"
                      }`}>
                        {isOccupied ? "Ocupada" : "Livre"}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                        <Users size={12} /> {table.capacity}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-foreground">
                      {table.name}
                    </h3>

                    {isOccupied && (
                      <p className="text-xs text-foreground font-bold truncate mt-1">
                        {table.customerName}
                      </p>
                    )}
                  </div>

                  {isOccupied ? (
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          {table.items?.length || 0} itens
                        </span>
                        <span className="font-black text-foreground text-sm">
                          R$ {table.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {unsentCount > 0 && (
                        <div className="text-[10px] font-bold text-primary mt-1 flex items-center gap-1">
                          <Send size={10} /> {unsentCount} para a cozinha
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-success flex items-center gap-1 mt-3">
                      <Plus size={14} /> Abrir Comanda
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal: Abertura de Mesa */}
        {showOpenTableModal && selectedTable && selectedTable.status === "livre" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass rounded-3xl p-6 border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-success/20 text-success">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">Abrir {selectedTable.name}</h3>
                    <p className="text-xs text-muted-foreground">Inicie a comanda para os clientes da mesa.</p>
                  </div>
                </div>
                <button onClick={() => setShowOpenTableModal(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleOpenTable} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Nome do Cliente / Responsável (Opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: João Silva, Família Santos"
                    value={openCustomerName}
                    onChange={e => setOpenCustomerName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    WhatsApp para Fidelidade / Conta Digital (CRM Enxuto)
                  </label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="(11) 99999-9999"
                      value={openCustomerPhone}
                      onChange={e => setOpenCustomerPhone(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <Phone size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    type="button" 
                    onClick={() => setShowOpenTableModal(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25"
                  >
                    Confirmar Abertura
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Adicionar Nova Mesa */}
        {showAddTableModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass rounded-3xl p-6 border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-black text-foreground">Adicionar Nova Mesa</h3>
                  <p className="text-xs text-muted-foreground">Expanda o salão ou crie mesas para novas áreas.</p>
                </div>
                <button onClick={() => setShowAddTableModal(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddNewTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Número da Mesa *
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="1"
                      value={newTableNumber} 
                      onChange={e => setNewTableNumber(Number(e.target.value))}
                      className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground font-bold focus:outline-none focus:border-primary" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Lugares (Capacidade)
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      value={newTableCapacity} 
                      onChange={e => setNewTableCapacity(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Identificação / Nome (Opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder={`Ex: Mesa ${newTableNumber < 10 ? '0' + newTableNumber : newTableNumber} - Salão / Varanda`}
                    value={newTableName} 
                    onChange={e => setNewTableName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary" 
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    type="button" 
                    onClick={() => setShowAddTableModal(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/25"
                  >
                    Cadastrar Mesa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drawer Lateral / Modal da Mesa Ocupada */}
        {selectedTable && selectedTable.status !== "livre" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="bg-card border-l border-border w-full max-w-2xl h-full flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
              {/* Topo da Comanda */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-500 text-white">
                        {selectedTable.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Cliente: <strong className="text-foreground">{selectedTable.customerName || "Salão"}</strong>
                      </span>
                    </div>
                    {selectedTable.customerPhone && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {selectedTable.customerPhone}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedTable(null)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Itens já lançados na comanda */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase font-extrabold text-muted-foreground">
                      Consumo da Mesa ({selectedTable.items?.length || 0} itens)
                    </h4>
                    <span className="text-xs font-black text-foreground">
                      Subtotal: R$ {selectedTable.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {(!selectedTable.items || selectedTable.items.length === 0) ? (
                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-border text-center text-xs text-muted-foreground">
                      Nenhum item adicionado ainda. Escolha produtos abaixo para lançar.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {selectedTable.items.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-xs"
                        >
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-2">
                              <span>{item.name}</span>
                              {item.sentToKitchen ? (
                                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Cozinha
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock size={10} /> Não enviado
                                </span>
                              )}
                            </div>
                            <span className="text-muted-foreground text-[11px]">
                              {item.quantity}x R$ {item.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-black text-foreground">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                            {!item.sentToKitchen && (
                              <button 
                                onClick={() => handleRemoveItemFromTable(item.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                title="Remover item não enviado"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Enviar para Cozinha se houver itens não enviados */}
                {selectedTable.items?.some(i => !i.sentToKitchen) && (
                  <div className="mb-6">
                    <button
                      onClick={handleSendToKitchen}
                      disabled={sendingToKitchen}
                      className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      {sendingToKitchen ? "Despachando para Cozinha..." : "Enviar Novos Itens para a Cozinha"}
                    </button>
                  </div>
                )}

                {/* Catálogo de Adição Rápida de Produtos */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs uppercase font-extrabold text-muted-foreground mb-3 flex items-center gap-2">
                    <Plus size={14} className="text-primary" />
                    Lançar mais itens na mesa
                  </h4>

                  {/* Campo de Busca */}
                  <div className="relative mb-3">
                    <input 
                      type="text" 
                      placeholder="Buscar lanche, bebida ou porção..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2.5 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                    />
                    <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  </div>

                  {/* Grid de Produtos */}
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredCatalog.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItemToTable(item)}
                        className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border hover:border-primary text-left transition-all flex flex-col justify-between"
                      >
                        <span className="text-xs font-bold text-foreground line-clamp-1">{item.name}</span>
                        <span className="text-[11px] font-black text-success mt-1">
                          + R$ {item.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rodapé: Fechar Conta */}
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total a Pagar:</span>
                    <span className="text-2xl font-black text-foreground">
                      R$ {selectedTable.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowCloseBillModal(true)}
                    className="px-6 py-3 bg-success text-white rounded-2xl text-xs font-black hover:bg-success/90 shadow-lg shadow-success/25 transition-all flex items-center gap-2"
                  >
                    <Receipt size={16} />
                    Fechar Conta da Mesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Fechar Conta / Pagamento */}
        {showCloseBillModal && selectedTable && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass rounded-3xl p-6 border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-black text-foreground">Encerrar {selectedTable.name}</h3>
                  <p className="text-xs text-muted-foreground">Escolha a forma de pagamento para liberar a mesa.</p>
                </div>
                <button onClick={() => setShowCloseBillModal(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Formas de Pagamento */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        paymentMethod === "pix" 
                          ? "bg-primary text-white border-primary font-bold shadow-md" 
                          : "bg-card border-border text-foreground hover:border-primary"
                      }`}
                    >
                      <QrCode size={18} className="mx-auto mb-1" />
                      <span className="text-xs">PIX</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("cartao")}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        paymentMethod === "cartao" 
                          ? "bg-primary text-white border-primary font-bold shadow-md" 
                          : "bg-card border-border text-foreground hover:border-primary"
                      }`}
                    >
                      <CreditCard size={18} className="mx-auto mb-1" />
                      <span className="text-xs">Cartão</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("dinheiro")}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        paymentMethod === "dinheiro" 
                          ? "bg-primary text-white border-primary font-bold shadow-md" 
                          : "bg-card border-border text-foreground hover:border-primary"
                      }`}
                    >
                      <Banknote size={18} className="mx-auto mb-1" />
                      <span className="text-xs">Dinheiro</span>
                    </button>
                  </div>
                </div>

                {/* Desconto Opcional */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Desconto Promocional (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.50"
                    min="0"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Resumo Final */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Consumido:</span>
                    <span>R$ {selectedTable.totalAmount.toFixed(2)}</span>
                  </div>
                  {Number(discountAmount) > 0 && (
                    <div className="flex justify-between text-destructive font-bold">
                      <span>Desconto:</span>
                      <span>- R$ {Number(discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
                    <span>Total Final:</span>
                    <span className="text-success">
                      R$ {Math.max(0, selectedTable.totalAmount - (Number(discountAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button 
                    type="button"
                    onClick={() => setShowCloseBillModal(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground"
                  >
                    Voltar
                  </button>
                  <button 
                    type="button"
                    disabled={closingBill}
                    onClick={handleCloseBill}
                    className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25 flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    {closingBill ? "Processando..." : "Confirmar e Liberar Mesa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
