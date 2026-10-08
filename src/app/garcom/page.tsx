"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTables } from "../../hooks/useTables";
import { menuService } from "../../services/menuService";
import { TableItem, MenuItem } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { Smartphone, Plus, ArrowLeft, Send, Trash2, Search, CheckCircle2, Clock } from "lucide-react";
import { OpenTableModal } from "../../components/tables/OpenTableModal";

export default function GarcomPage() {
  const { tenantId, currency, tenantProfile } = useAuth();
  const { tables, loading, openTable, addItem, removeItem, sendToKitchen } = useTables(tenantId);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = menuService.subscribeMenu(tenantId, setMenuItems);
    return () => unsub();
  }, [tenantId]);

  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  const categories = ["todos", "entradas", "pratos", "bebidas", "sobremesas"];
  const filteredMenu = menuItems.filter(m => {
    const matchesCat = activeCategory === "todos" || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const unsentCount = selectedTable?.items?.filter(i => !i.sentToKitchen).length || 0;

  const handleSend = async () => {
    if (!selectedTable) return;
    setSending(true);
    try {
      await sendToKitchen(selectedTable);
      alert("✅ Pedido enviado para a cozinha!");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto shadow-2xl pb-20">
      {/* Topo do Garçom */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/20 text-primary">
            <Smartphone size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground">Terminal do Garçom</h1>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
              {tenantProfile?.businessName || "Meu Restaurante"}
            </p>
          </div>
        </div>

        {selectedTable && (
          <button
            onClick={() => setSelectedTable(null)}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-xl"
          >
            <ArrowLeft size={14} /> Mesas
          </button>
        )}
      </header>

      {/* VISÃO 1: GRADE DE MESAS */}
      {!selectedTable && (
        <div className="p-4 flex-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase mb-3">Salão & Mesas</h2>
          {loading ? (
            <div className="text-center py-10 text-xs text-muted-foreground">A carregar mesas...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tables.map(t => {
                const isOccupied = t.status !== "livre";
                const isCalling = t.status === "chamando_garcom";
                const unsent = t.items?.filter(i => !i.sentToKitchen).length || 0;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTable(t);
                      if (!isOccupied) setShowOpenModal(true);
                    }}
                    className={`p-4 rounded-3xl border text-left flex flex-col justify-between min-h-[140px] transition-all active:scale-95 shadow-sm ${
                      isCalling
                        ? "border-destructive bg-destructive/15 animate-bounce shadow-destructive/20"
                        : isOccupied 
                          ? "border-amber-500/40 bg-amber-500/10" 
                          : "border-border bg-card"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-black text-foreground">{t.name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCalling ? "bg-destructive text-white" : isOccupied ? "bg-amber-500 text-white" : "bg-success/20 text-success"
                      }`}>
                        {isCalling ? "Chamando!" : isOccupied ? "Ocupada" : "Livre"}
                      </span>
                    </div>

                    {isOccupied ? (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <p className="text-xs text-muted-foreground truncate font-semibold">
                          {t.customerName || "Cliente"}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-black text-foreground">
                            {formatCurrency(t.totalAmount || 0, currency)}
                          </span>
                          {unsent > 0 && (
                            <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-md">
                              +{unsent}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-success font-bold flex items-center gap-1 mt-2">
                        <Plus size={14} /> Abrir Mesa
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISÃO 2: COMANDA DA MESA SELECIONADA */}
      {selectedTable && selectedTable.status !== "livre" && (
        <div className="flex-1 flex flex-col p-4">
          <div className="bg-card border border-border p-4 rounded-3xl mb-3 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-lg">
                {selectedTable.name}
              </span>
              <h3 className="text-base font-black text-foreground mt-1">
                {selectedTable.customerName || "Cliente"}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total</span>
              <div className="text-lg font-black text-success">
                {formatCurrency(selectedTable.totalAmount || 0, currency)}
              </div>
            </div>
          </div>

          {unsentCount > 0 && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full mb-3 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-95 transition-all"
            >
              <Send size={15} />
              {sending ? "A despachar..." : `Enviar ${unsentCount} itens para a cozinha`}
            </button>
          )}

          {/* Consumo Atual */}
          <div className="mb-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {selectedTable.items?.map(it => (
              <div key={it.id} className="p-2 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
                <div className="flex-1">
                  <div className="font-bold text-foreground flex items-center gap-1">
                    <span>{it.quantity}x {it.name}</span>
                    {it.sentToKitchen ? (
                      <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> Cozinha
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 rounded-full flex items-center gap-0.5">
                        <Clock size={9} /> Pendente
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(it.price * it.quantity, currency)}</span>
                  {!it.sentToKitchen && (
                    <button onClick={() => removeItem(selectedTable, it.id)} className="text-destructive p-1">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Catálogo Rápido */}
          <div className="flex-1 flex flex-col">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground mb-2 focus:outline-none"
            />

            <div className="flex gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap ${
                    activeCategory === c ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {filteredMenu.map(m => (
                <button
                  key={m.id}
                  onClick={() => addItem(selectedTable, m)}
                  className="p-2.5 rounded-xl bg-card border border-border hover:border-primary text-left flex flex-col justify-between active:scale-95"
                >
                  <span className="text-xs font-bold line-clamp-1">{m.name}</span>
                  <span className="text-xs font-black text-success mt-1">
                    + {formatCurrency(m.price, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTable && showOpenModal && (
        <OpenTableModal
          isOpen={showOpenModal}
          table={selectedTable}
          onClose={() => setShowOpenModal(false)}
          onConfirm={(name, phone, nif) => openTable(selectedTable.id, name, phone, nif).then(() => {})}
        />
      )}
    </div>
  );
}
