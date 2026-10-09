"use client";

import React from "react";
import { Clock, Play, Bell, Check, Flame, Zap, AlertCircle } from "lucide-react";
import { Order, OrderStatus } from "../../domain/types";

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
  const estMinutes = order.estimated_minutes || 8;
  const isOverdue = elapsedMinutes >= estMinutes;

  return (
    <div className={`bg-card rounded-2xl p-5 border shadow-lg transition-all ${
      isOverdue 
        ? "border-destructive/80 bg-destructive/5" 
        : order.status === "pronto"
          ? "border-success/60 bg-success/5"
          : "border-border"
    }`}>
      {/* Topo do Card */}
      <div className="flex justify-between items-start pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-foreground">#{order.order_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
              order.order_type === "qrcode_mesa"
                ? "bg-primary text-white"
                : "bg-black/10 dark:bg-white/10 text-foreground"
            }`}>
              {order.order_type === "qrcode_mesa" ? "📱 QR Code" : "🍔 Salão"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[170px]">
            {order.customer_name}
          </p>
        </div>

        <div className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
          isOverdue ? "bg-destructive text-white animate-pulse" : "bg-black/10 dark:bg-white/10 text-foreground"
        }`}>
          <Clock size={12} />
          {elapsedMinutes} / ~{estMinutes}m
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="py-3 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="bg-black/5 dark:bg-white/5 p-2 rounded-xl text-xs">
            <div className="font-bold text-foreground flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-primary font-black mr-1.5">{item.quantity}x</span>
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {item.courseStage && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-muted-foreground">
                    {item.courseStage}
                  </span>
                )}
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  item.marchingStatus === "marchar" 
                    ? "bg-emerald-500/20 text-emerald-600 font-extrabold" 
                    : "bg-amber-500/20 text-amber-500"
                }`}>
                  {item.marchingStatus === "marchar" ? "Marchar" : "Aguardar"}
                </span>
              </div>
            </div>
            {item.notes && (
              <p className="text-[10px] text-amber-500 font-bold mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Ações da Esteira */}
      <div className="pt-2">
        {order.status === "pendente" && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(order.id, "preparando")}
              className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Play size={14} /> Iniciar Preparo
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "pronto")}
              title="Pronto Direto (Bebidas / Fast-track)"
              className="py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <Zap size={13} className="fill-black" /> Pronto ⚡
            </button>
          </div>
        )}

        {order.status === "preparando" && (
          <button
            onClick={() => onUpdateStatus(order.id, "pronto")}
            className="w-full py-2.5 bg-success hover:bg-success/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Bell size={14} /> Pronto! Chamar Balcão 🔔
          </button>
        )}

        {order.status === "pronto" && (
          <button
            onClick={() => onUpdateStatus(order.id, "entregue")}
            className="w-full py-2.5 bg-foreground text-background font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> Confirmar Entrega
          </button>
        )}
      </div>
    </div>
  );
}
