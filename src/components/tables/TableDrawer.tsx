"use client";

import React, { useState } from "react";
import { X, Send, Plus, Trash2, Receipt, Search, CheckCircle2, Clock } from "lucide-react";
import { TableItem, MenuItem, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";

interface TableDrawerProps {
  table: TableItem | null;
  currency: CurrencyCode;
  menuItems: MenuItem[];
  onClose: () => void;
  onAddItem: (item: MenuItem, notes?: string) => Promise<any>;
  onRemoveItem: (itemId: string) => Promise<any>;
  onSendToKitchen: () => Promise<void>;
  onOpenCloseBill: () => void;
}

export function TableDrawer({
  table,
  currency,
  menuItems,
  onClose,
  onAddItem,
  onRemoveItem,
  onSendToKitchen,
  onOpenCloseBill
}: TableDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);

  if (!table) return null;

  const unsentCount = table.items?.filter(i => !i.sentToKitchen).length || 0;
  const filteredMenu = menuItems.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    setSending(true);
    try {
      await onSendToKitchen();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-card border-l border-border w-full max-w-xl h-full flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Topo da Comanda */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-500 text-white">
                  {table.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Cliente: <strong className="text-foreground">{table.customerName || "Salão"}</strong>
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-xl">
              <X size={20} />
            </button>
          </div>

          {/* Lista de Itens na Comanda */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">
                Consumo da Mesa ({table.items?.length || 0} itens)
              </h4>
              <span className="text-xs font-black text-foreground">
                Total: {formatCurrency(table.totalAmount || 0, currency)}
              </span>
            </div>

            {(!table.items || table.items.length === 0) ? (
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-border text-center text-xs text-muted-foreground">
                Nenhum item lançado ainda. Escolha produtos abaixo para adicionar.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {table.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-xs">
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{item.quantity}x {item.name}</span>
                        {item.sentToKitchen ? (
                          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Cozinha
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={10} /> Pendente
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-[10px] text-amber-500 mt-0.5 italic">Obs: {item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-foreground">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </span>
                      {!item.sentToKitchen && (
                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
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

          {/* Botão Enviar para Cozinha se houver itens novos */}
          {unsentCount > 0 && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25 flex items-center justify-center gap-2 mb-4 active:scale-95"
            >
              <Send size={15} />
              {sending ? "A despachar..." : `Enviar ${unsentCount} Novos Itens para a Cozinha`}
            </button>
          )}

          {/* Adição Rápida de Produtos */}
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs uppercase font-extrabold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Plus size={14} className="text-primary" /> Lançar mais produtos
            </h4>

            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-border rounded-xl p-2.5 pl-9 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              />
              <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredMenu.map(m => (
                <button
                  key={m.id}
                  onClick={() => onAddItem(m)}
                  className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border hover:border-primary text-left transition-all flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-foreground line-clamp-1">{m.name}</span>
                  <span className="text-[11px] font-black text-success mt-1">
                    + {formatCurrency(m.price, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé: Fechar Conta */}
        <div className="pt-4 border-t border-border mt-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-muted-foreground block">Total a Pagar:</span>
              <span className="text-2xl font-black text-foreground">
                {formatCurrency(table.totalAmount || 0, currency)}
              </span>
            </div>
            <button
              onClick={onOpenCloseBill}
              className="px-6 py-3 bg-success text-white rounded-2xl text-xs font-black hover:bg-success/90 shadow-lg shadow-success/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Receipt size={16} /> Fechar Conta da Mesa
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
