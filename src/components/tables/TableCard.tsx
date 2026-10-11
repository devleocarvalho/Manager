"use client";

import React from "react";
import { Users, Send, Plus, Bell, Clock } from "lucide-react";
import { TableItem, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { analyticsService } from "../../services/analyticsService";

interface TableCardProps {
  table: TableItem;
  currency: CurrencyCode;
  onClick: () => void;
}

export function TableCard({ table, currency, onClick }: TableCardProps) {
  const isOccupied = table.status !== "livre";
  const isCalling = table.status === "chamando_garcom";
  const unsentCount = table.items?.filter(i => !i.sentToKitchen).length || 0;

  const hasMain = table.items?.some(i => i.courseStage === "principal" || i.category === "pratos");
  const hasDessert = table.items?.some(i => i.courseStage === "sobremesa" || i.category === "sobremesas");
  const isBilling = table.status === "fechamento";
  const estDeparture = analyticsService.calculateEstimatedDeparture(
    table.openedAt,
    table.items?.length || 0,
    hasMain,
    hasDessert,
    isBilling
  );

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
          <div className="flex items-center gap-1.5">
            <span className={`text-xs uppercase font-black px-2.5 py-1 rounded-full ${
              isCalling
                ? "bg-destructive text-white"
                : isOccupied 
                  ? "bg-amber-500 text-white shadow-sm" 
                  : "bg-success/20 text-success"
            }`}>
              {isCalling ? "Chamando!" : isOccupied ? "Ocupada" : "Livre"}
            </span>
            {table.area && (
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-foreground">
                {table.area}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground font-bold">
            <Users size={14} className="text-primary" /> {table.capacity}
          </div>
        </div>

        <h3 className="text-xl font-black text-foreground">
          {table.name}
        </h3>

        {isOccupied && (
          <div className="mt-1.5">
            <p className="text-sm text-foreground font-black truncate">
              {table.customerName || "Cliente"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={12} className="text-primary" />
              <span>Saída est.: <strong className="text-foreground">{estDeparture}</strong></span>
            </div>
          </div>
        )}
      </div>

      {isOccupied ? (
        <div className="mt-3 pt-2.5 border-t border-border">
          <div className="flex justify-between items-center text-xs">
            <span className="text-xs font-bold text-muted-foreground">
              {table.items?.length || 0} itens
            </span>
            <span className="font-black text-foreground text-base">
              {formatCurrency(table.totalAmount || 0, currency)}
            </span>
          </div>
          {unsentCount > 0 && (
            <div className="text-xs font-black text-primary mt-1 flex items-center gap-1">
              <Send size={12} /> {unsentCount} para a cozinha
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs font-black text-success flex items-center gap-1 mt-3">
          <Plus size={15} /> Abrir Mesa
        </div>
      )}
    </button>
  );
}
