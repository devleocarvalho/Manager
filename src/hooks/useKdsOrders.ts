"use client";

import { useState, useEffect } from "react";
import { Order, OrderStatus } from "../domain/types";
import { orderService } from "../services/orderService";
import { playNewOrderSound, playOrderReadySound } from "../lib/sound";

export function useKdsOrders(tenantId: string, audioEnabled = true) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const pendentes = orders.filter(o => o.status === "pendente");
  const preparando = orders.filter(o => o.status === "preparando");
  const prontos = orders.filter(o => o.status === "pronto");

  return {
    orders,
    loading,
    pendentes,
    preparando,
    prontos,
    updateStatus
  };
}
