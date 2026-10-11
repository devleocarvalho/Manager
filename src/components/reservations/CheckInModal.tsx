"use client";

import React, { useState } from "react";
import { X, Check, UtensilsCrossed, Users, AlertCircle } from "lucide-react";
import { Reservation, TableItem } from "../../domain/types";
import { reservationService } from "../../services/reservationService";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  reservation: Reservation;
  tables: TableItem[];
  onSuccess: () => void;
}

export function CheckInModal({
  isOpen,
  onClose,
  tenantId,
  reservation,
  tables,
  onSuccess
}: CheckInModalProps) {
  // Se a reserva já tinha mesa pré-vinculada, seleciona ela; caso contrário, busca primeira mesa livre com capacidade adequada
  const defaultTableId = reservation.tableId || 
    tables.find(t => t.status === "livre" && t.capacity >= reservation.guestsCount)?.id ||
    tables.find(t => t.status === "livre")?.id || "";

  const [selectedTableId, setSelectedTableId] = useState(defaultTableId);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedTableId) {
      alert("Por favor, selecione uma mesa para acomodar os clientes.");
      return;
    }

    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    setLoading(true);
    try {
      await reservationService.checkInReservation(
        tenantId,
        reservation,
        table.id,
        table.number
      );
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erro ao realizar check-in e abrir comanda da mesa.");
    } finally {
      setLoading(false);
    }
  };

  const freeTables = tables.filter(t => t.status === "livre");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-success/20 text-success">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Check-in de Reserva</h3>
              <p className="text-xs text-muted-foreground">Ocupar mesa e abrir comanda no salão</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-full bg-black/5 dark:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Detalhes do Cliente */}
        <div className="my-4 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border space-y-1.5 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span className="text-foreground text-sm font-black">{reservation.customerName}</span>
            <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
              <Users size={12} /> {reservation.guestsCount} Pessoas
            </span>
          </div>
          <div className="text-muted-foreground flex justify-between">
            <span>Horário: <strong>{reservation.time}</strong></span>
            <span>Setor: <strong className="capitalize">{reservation.areaPreference || "Qualquer"}</strong></span>
          </div>
          {reservation.notes && (
            <p className="text-[11px] text-amber-500 font-semibold bg-amber-500/10 p-2 rounded-xl mt-1">
              Nota: {reservation.notes}
            </p>
          )}
        </div>

        {/* Seleção de Mesa */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-foreground block">
            Selecione a Mesa para Acomodar:
          </label>
          <select
            value={selectedTableId}
            onChange={e => setSelectedTableId(e.target.value)}
            className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Selecione uma mesa disponível...</option>
            {freeTables.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.area || "Salão"} • Capacidade: {t.capacity} lugares) - LIVRE
              </option>
            ))}
          </select>

          {freeTables.length === 0 && (
            <div className="p-2.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-1.5">
              <AlertCircle size={14} /> Todas as mesas estão ocupadas no momento!
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedTableId}
            className="px-5 py-2.5 rounded-xl bg-success text-white text-xs font-black shadow-md shadow-success/25 hover:bg-success/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={16} />
            {loading ? "A abrir mesa..." : "Confirmar Chegada & Sentar"}
          </button>
        </div>
      </div>
    </div>
  );
}
