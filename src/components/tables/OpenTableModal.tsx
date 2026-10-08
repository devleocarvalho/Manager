"use client";

import React, { useState } from "react";
import { X, UtensilsCrossed, Phone, FileText } from "lucide-react";
import { TableItem } from "../../domain/types";

interface OpenTableModalProps {
  isOpen: boolean;
  table: TableItem;
  onClose: () => void;
  onConfirm: (name: string, phone: string, nif: string) => Promise<void>;
}

export function OpenTableModal({ isOpen, table, onClose, onConfirm }: OpenTableModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(name, phone, nif);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-6 border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-success/20 text-success">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Abrir {table.name}</h3>
              <p className="text-xs text-muted-foreground">Inicie a comanda de consumo para os clientes.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              Nome do Cliente / Responsável (Opcional)
            </label>
            <input 
              type="text" 
              placeholder="Ex: Família Santos, João Silva"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              NIF / VAT ID para Fatura (Opcional)
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ex: 123456789"
                value={nif}
                onChange={e => setNif(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 pl-9 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <FileText size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25"
            >
              {loading ? "A abrir..." : "Confirmar Abertura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
