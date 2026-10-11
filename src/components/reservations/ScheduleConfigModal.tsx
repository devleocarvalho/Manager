"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, Check, AlertCircle } from "lucide-react";
import { OperatingSchedule, DaySchedule } from "../../domain/types";
import { DAY_NAMES, reservationService } from "../../services/reservationService";

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  initialSchedule: OperatingSchedule;
  onSaved: (schedule: OperatingSchedule) => void;
}

export function ScheduleConfigModal({
  isOpen,
  onClose,
  tenantId,
  initialSchedule,
  onSaved
}: ScheduleConfigModalProps) {
  const [schedule, setSchedule] = useState<OperatingSchedule>(initialSchedule);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex: number) => {
    const current = schedule.days[dayIndex] || { isOpen: false };
    const updatedDay: DaySchedule = {
      ...current,
      isOpen: !current.isOpen,
      lunch: current.lunch || { open: "12:00", close: "15:30" },
      dinner: current.dinner || { open: "19:30", close: "23:00" }
    };

    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayIndex]: updatedDay
      }
    }));
  };

  const handleUpdateShift = (
    dayIndex: number, 
    shift: "lunch" | "dinner", 
    field: "open" | "close", 
    val: string
  ) => {
    const current = schedule.days[dayIndex] || { isOpen: true };
    const shiftData = current[shift] || { open: "12:00", close: "15:00" };

    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayIndex]: {
          ...current,
          [shift]: {
            ...shiftData,
            [field]: val
          }
        }
      }
    }));
  };

  const handleToggleShiftEnable = (dayIndex: number, shift: "lunch" | "dinner") => {
    const current = schedule.days[dayIndex];
    if (!current) return;

    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayIndex]: {
          ...current,
          [shift]: current[shift] ? undefined : (shift === "lunch" ? { open: "12:00", close: "15:30" } : { open: "19:30", close: "23:00" })
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await reservationService.saveOperatingSchedule(tenantId, schedule);
      onSaved(schedule);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar horários de funcionamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-200">
        <div>
          {/* Topo */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Dias & Horários de Funcionamento</h3>
                <p className="text-xs text-muted-foreground">
                  Defina os dias em que a casa abre e os turnos aceitos para reserva.
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

          {/* Configurações Globais */}
          <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border text-xs">
            <div>
              <label className="font-bold text-muted-foreground block mb-1">Intervalo dos Horários</label>
              <select
                value={schedule.slotDurationMinutes || 30}
                onChange={e => setSchedule(p => ({ ...p, slotDurationMinutes: Number(e.target.value) }))}
                className="w-full bg-card border border-border rounded-xl p-2 font-semibold text-foreground"
              >
                <option value={15}>A cada 15 minutos</option>
                <option value={30}>A cada 30 minutos (Recomendado)</option>
                <option value={45}>A cada 45 minutos</option>
                <option value={60}>A cada 1 hora</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-muted-foreground block mb-1">Capacidade Máxima / Slot</label>
              <input
                type="number"
                min={1}
                max={200}
                value={schedule.maxGuestsPerSlot || 20}
                onChange={e => setSchedule(p => ({ ...p, maxGuestsPerSlot: Number(e.target.value) }))}
                className="w-full bg-card border border-border rounded-xl p-2 font-semibold text-foreground"
              />
            </div>
          </div>

          {/* Lista de Dias da Semana */}
          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
              const dayConfig = schedule.days[dayIdx] || { isOpen: false };
              const isClosed = !dayConfig.isOpen;

              return (
                <div 
                  key={dayIdx}
                  className={`p-3 rounded-2xl border transition-all ${
                    isClosed 
                      ? "bg-black/5 dark:bg-white/5 border-border/60 opacity-60" 
                      : "bg-card border-primary/30 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(dayIdx)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                          dayConfig.isOpen ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                      </button>
                      <span className="font-black text-xs text-foreground">
                        {DAY_NAMES[dayIdx]}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      dayConfig.isOpen 
                        ? "bg-success/20 text-success" 
                        : "bg-destructive/20 text-destructive"
                    }`}>
                      {dayConfig.isOpen ? "Aberto" : "Fechado"}
                    </span>
                  </div>

                  {dayConfig.isOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-border/40 text-xs">
                      {/* Almoço */}
                      <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={12} /> Almoço
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleShiftEnable(dayIdx, "lunch")}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            {dayConfig.lunch ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                        {dayConfig.lunch ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="time"
                              value={dayConfig.lunch.open}
                              onChange={e => handleUpdateShift(dayIdx, "lunch", "open", e.target.value)}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs w-full text-foreground"
                            />
                            <span className="text-muted-foreground text-[10px]">até</span>
                            <input
                              type="time"
                              value={dayConfig.lunch.close}
                              onChange={e => handleUpdateShift(dayIdx, "lunch", "close", e.target.value)}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs w-full text-foreground"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Não opera no almoço</span>
                        )}
                      </div>

                      {/* Jantar */}
                      <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={12} /> Jantar
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleShiftEnable(dayIdx, "dinner")}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            {dayConfig.dinner ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                        {dayConfig.dinner ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="time"
                              value={dayConfig.dinner.open}
                              onChange={e => handleUpdateShift(dayIdx, "dinner", "open", e.target.value)}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs w-full text-foreground"
                            />
                            <span className="text-muted-foreground text-[10px]">até</span>
                            <input
                              type="time"
                              value={dayConfig.dinner.close}
                              onChange={e => handleUpdateShift(dayIdx, "dinner", "close", e.target.value)}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs w-full text-foreground"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Não opera no jantar</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé / Ações */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
          {successMsg ? (
            <div className="flex items-center gap-1.5 text-xs text-success font-black">
              <Check size={16} /> Horários atualizados com sucesso!
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertCircle size={13} />
              Dias fechados não poderão ser reservados nem no painel nem pelo cliente.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-1.5"
            >
              <Check size={15} />
              {saving ? "A guardar..." : "Guardar Horários"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
