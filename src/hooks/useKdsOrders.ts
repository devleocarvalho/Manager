"use client";

import { useState, useEffect } from "react";
import { Order, OrderStatus } from "../domain/types";
import { orderService } from "../services/orderService";
import { playNewOrderSound, playOrderReadySound } from "../lib/sound";

export type PacingFilterType = "todos" | "salao" | "delivery";

export function useKdsOrders(tenantId: string, audioEnabled = true) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pacingFilter, setPacingFilter] = useState<PacingFilterType>("todos");

  useEffect(() => {
    if (!tenantId) return;

    let prevCount = 0;
    const unsub = orderService.subscribeOrders(tenantId, (list) => {
      const pendingCount = list.filter(o => o.status === "pendente").length;
      if (prevCount > 0 && pendingCount > prevCount && audioEnabled) {
        playNewOrderSound();
      }
      prevCount = pendingCount;
      setOrders(list);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId, audioEnabled]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (status === "pronto" && audioEnabled) {
      playOrderReadySound();
    }
    await orderService.updateOrderStatus(orderId, status);
  };

  /**
   * Algoritmo de Fair Kitchen Pacing:
   * Equilibra a fila entre clientes físicos sentados (Salão/Mesa) e pedidos online (Delivery/Takeaway).
   * Evita tanto que clientes presenciais esperem excessivamente, quanto que pedidos de estafetas atrasem.
   */
  const calculatePacingScore = (order: Order): number => {
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
    const isSalon = order.order_type === "local" || order.order_type === "qrcode_mesa" || order.pacing_priority === "prioridade_salao";
    
    if (isSalon) {
      // Salão tem peso preferencial inicial para clientes sentados
      return elapsedMinutes * 1.5 + 8;
    } else {
      // Delivery ganha aceleração progressiva à medida que a janela de despacho se aproxima
      const est = order.estimated_minutes || 25;
      const urgencyBoost = elapsedMinutes >= (est * 0.4) ? (elapsedMinutes - (est * 0.4)) * 2.2 : 0;
      return elapsedMinutes * 1.0 + urgencyBoost;
    }
  };

  const matchesFilter = (order: Order): boolean => {
    if (pacingFilter === "todos") return true;
    const isSalon = order.order_type === "local" || order.order_type === "qrcode_mesa";
    if (pacingFilter === "salao") return isSalon;
    if (pacingFilter === "delivery") return !isSalon;
    return true;
  };

  // Pedidos Pendentes ordenados pelo Algoritmo de Pacing
  const pendentes = orders
    .filter(o => o.status === "pendente")
    .filter(matchesFilter)
    .sort((a, b) => calculatePacingScore(b) - calculatePacingScore(a));

  const preparando = orders
    .filter(o => o.status === "preparando")
    .filter(matchesFilter);

  const prontos = orders
    .filter(o => o.status === "pronto")
    .filter(matchesFilter);

  // Métricas de Ritmo Operacional
  const allActiveOrders = orders.filter(o => o.status !== "entregue");
  const salaoCount = allActiveOrders.filter(o => o.order_type === "local" || o.order_type === "qrcode_mesa").length;
  const deliveryCount = allActiveOrders.filter(o => o.order_type === "delivery" || o.order_type === "takeaway" || o.order_type === "viagem").length;

  return {
    orders,
    loading,
    pendentes,
    preparando,
    prontos,
    updateStatus,
    pacingFilter,
    setPacingFilter,
    salaoCount,
    deliveryCount
  };
}
