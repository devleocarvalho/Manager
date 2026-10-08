"use client";

import React from "react";
import { Users, Send, Plus, Bell } from "lucide-react";
import { TableItem, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";

interface TableCardProps {
  table: TableItem;
  currency: CurrencyCode;
  onClick: () => void;
}

export function TableCard({ table, currency, onClick }: TableCardProps) {
  const isOccupied = table.status !== "livre";
  const isCalling = table.status === "chamando_garcom";
  const unsentCount = table.items?.filter(i => !i.sentToKitchen).length || 0;

  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between min-h-[160px] shadow-sm ${
        isCalling
          ? "border-destructive bg-destructive/10 animate-bounce shadow-destructive/20"
          : isOccupied 
            ? "bg-amber-500/10 border-amber-500/40 hover:border-amber-500" 
            : "bg-card border-border hover:border-success/60"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
            isCalling
              ? "bg-destructive text-white"
              : isOccupied 
                ? "bg-amber-500 text-white" 
                : "bg-success/20 text-success"
          }`}>
            {isCalling ? "Chamando!" : isOccupied ? "Ocupada" : "Livre"}
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
            {table.customerName || "Cliente"}
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
              {formatCurrency(table.totalAmount || 0, currency)}
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
          <Plus size={14} /> Abrir Mesa
        </div>
      )}
    </button>
  );
}
