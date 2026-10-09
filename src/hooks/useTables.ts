"use client";

import { useState, useEffect } from "react";
import { TableItem, MenuItem, CourseStage } from "../domain/types";
import { tableService } from "../services/tableService";

export function useTables(tenantId: string) {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = tableService.subscribeTables(tenantId, (list) => {
      setTables(list);
      setLoading(false);
    });
    return () => unsub();
  }, [tenantId]);

  const openTable = async (tableId: string, name: string, phone = "", nif = "") => {
    return await tableService.openTable(tableId, name, phone, nif);
  };

  const addItem = async (table: TableItem, item: MenuItem, notes = "", courseStage?: CourseStage) => {
    return await tableService.addItemToTable(table.id, table.items, item, notes, courseStage);
  };

  const toggleMarchItem = async (table: TableItem, itemId: string) => {
    return await tableService.toggleMarchItem(table.id, table.items, itemId);
  };

  const removeItem = async (table: TableItem, itemId: string) => {
    return await tableService.removeItemFromTable(table.id, table.items, itemId);
  };

  const sendToKitchen = async (table: TableItem) => {
    return await tableService.sendToKitchen(tenantId, table);
  };

  const closeBill = async (table: TableItem, finalAmount: number, paymentMethod: string, vatAmount = 0) => {
    return await tableService.closeBill(tenantId, table, finalAmount, paymentMethod, vatAmount);
  };

  const createTable = async (num: number, name: string, cap: number) => {
    return await tableService.createTable(tenantId, num, name, cap);
  };

  return {
    tables,
    loading,
    openTable,
    addItem,
    toggleMarchItem,
    removeItem,
    sendToKitchen,
    closeBill,
    createTable
  };
}
