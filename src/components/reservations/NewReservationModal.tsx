"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, User, Phone, Mail, FileText, AlertTriangle, Check } from "lucide-react";
import { OperatingSchedule, TableItem, ShiftType } from "../../domain/types";
import { reservationService, DAY_NAMES } from "../../services/reservationService";

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  schedule: OperatingSchedule;
  tables: TableItem[];
  onCreated: () => void;
}

export function NewReservationModal({
  isOpen,
  onClose,
  tenantId,
  schedule,
  tables,
  onCreated
}: NewReservationModalProps) {
  // Hoje no formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("");
  const [shift, setShift] = useState<ShiftType>("almoco");
  const [guestsCount, setGuestsCount] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [areaPreference, setAreaPreference] = useState<"salao" | "esplanada" | "balcao" | "qualquer">("qualquer");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [notes, setNotes] = useState("");

  const [availableSlots, setAvailableSlots] = useState<{ time: string; shift: ShiftType }[]>([]);
  const [isOpenDay, setIsOpenDay] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    const open = reservationService.isDateOpen(date, schedule);
    setIsOpenDay(open);

    if (open) {
      const slots = reservationService.getAvailableSlots(date, schedule);
      setAvailableSlots(slots);
      if (slots.length > 0) {
        setTime(slots[0].time);
        setShift(slots[0].shift);
      } else {
        setTime("");
      }
    } else {
      setAvailableSlots([]);
      setTime("");
    }
  }, [date, schedule]);

  if (!isOpen) return null;

  // Extrai nome do dia
  const dateParts = date.split("-").map(Number);
  const selectedDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
  const dayName = DAY_NAMES[selectedDateObj.getDay()];

  const handleSlotSelect = (slotTime: string, slotShift: ShiftType) => {
    setTime(slotTime);
    setShift(slotShift);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !date || !time) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!isOpenDay) {
      alert("Não é possível criar reserva em um dia em que o restaurante não opera.");
      return;
    }

    setLoading(true);
    try {
      const selectedTable = tables.find(t => t.id === selectedTableId);

      await reservationService.createReservation({
        tenant_id: tenantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        date,
        time,
        shift,
        guestsCount: Number(guestsCount) || 2,
        areaPreference,
        tableId: selectedTable ? selectedTable.id : undefined,
        tableNumber: selectedTable ? selectedTable.number : undefined,
        notes: notes.trim() || undefined,
        status: "confirmada",
        source: "painel"
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-200">
        <div>
          {/* Topo */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Nova Reserva de Mesa</h3>
                <p className="text-xs text-muted-foreground">
                  Agende atendimento para clientes respeitando os dias abertos da casa.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full bg-black/5 dark:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          <form id="new-res-form" onSubmit={handleSubmit} className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Data e Verificação de Dia Aberto */}
            <div>
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar size={14} /> Data da Reserva *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground flex-1 focus:border-primary focus:outline-none"
                />
                <span className="text-xs font-black text-muted-foreground bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl">
                  {dayName}
                </span>
              </div>

              {!isOpenDay && (
                <div className="mt-2 p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle size={16} className="shrink-0" />
                  <div>
                    <span className="font-bold">O restaurante não funciona aos {dayName}s!</span>
                    <p className="text-[11px] opacity-90">Por favor, escolha outro dia para agendar a reserva.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Slots de Horário */}
            {isOpenDay && (
              <div>
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Clock size={14} /> Horário Disponível * ({availableSlots.length} horários)
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                    Nenhum turno configurado para este dia nas configurações de funcionamento.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-border/60 rounded-2xl bg-black/5 dark:bg-white/5">
                    {availableSlots.map(slot => (
                      <button
                        type="button"
                        key={slot.time}
                        onClick={() => handleSlotSelect(slot.time, slot.shift)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          time === slot.time 
                            ? "bg-primary text-white shadow-md shadow-primary/25 scale-105" 
                            : "bg-card text-foreground border border-border hover:border-primary/50"
                        }`}
                      >
                        {slot.time} <span className="text-[9px] opacity-70">({slot.shift === "almoco" ? "Almoço" : "Jantar"})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pessoas e Setor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Users size={14} /> Número de Pessoas *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestsCount}
                  onChange={e => setGuestsCount(Number(e.target.value))}
                  required
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  Setor Preferido
                </label>
                <select
                  value={areaPreference}
                  onChange={e => setAreaPreference(e.target.value as any)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="qualquer">Qualquer Setor</option>
                  <option value="salao">Salão Principal</option>
                  <option value="esplanada">Esplanada (Exterior)</option>
                  <option value="balcao">Balcão</option>
                </select>
              </div>
            </div>

            {/* Mesa Pré-Alocada (Opcional) */}
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                Vincular a uma Mesa Agora (Opcional)
              </label>
              <select
                value={selectedTableId}
                onChange={e => setSelectedTableId(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Alocar no momento do check-in / chegada</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.area || "Salão"} • {t.capacity} lugares) - {t.status === "livre" ? "Livre" : "Ocupada agora"}
                  </option>
                ))}
              </select>
            </div>

            {/* Dados do Cliente */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <span className="text-[11px] font-black uppercase text-muted-foreground">Dados de Contato</span>
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    placeholder="Nome completo do cliente *"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                  <input
                    type="tel"
                    placeholder="Telefone / WhatsApp *"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                  <input
                    type="email"
                    placeholder="E-mail (opcional)"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <FileText className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Observações (ex: Aniversário, cadeira de bebé, alergias)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            form="new-res-form"
            type="submit"
            disabled={loading || !isOpenDay || !time}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={15} />
            {loading ? "A agendar..." : "Confirmar Reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
