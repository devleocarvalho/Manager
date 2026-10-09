"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  CreditCard,
  Printer
} from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { CashRegisterShift, CurrencyCode, ShiftType } from "../../domain/types";
import { cashShiftService } from "../../services/cashShiftService";

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  currency: CurrencyCode;
}

export function CashShiftModal({ isOpen, onClose, tenantId, currency }: CashShiftModalProps) {
  const [shift, setShift] = useState<CashRegisterShift | null>(null);
  const [loading, setLoading] = useState(true);

  // Abertura de Turno
  const [operatorName, setOperatorName] = useState("");
  const [shiftType, setShiftType] = useState<ShiftType>("almoco");
  const [initialFloat, setInitialFloat] = useState("150");

  // Sangria / Suprimento
  const [actionType, setActionType] = useState<"sangria" | "suprimento" | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");

  // Fechamento Cego
  const [isClosing, setIsClosing] = useState(false);
  const [declaredCash, setDeclaredCash] = useState("");
  const [closedSummary, setClosedSummary] = useState<CashRegisterShift | null>(null);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    loadShift();
  }, [isOpen, tenantId]);

  const loadShift = async () => {
    setLoading(true);
    try {
      const active = await cashShiftService.getActiveShift(tenantId);
      setShift(active);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await cashShiftService.openShift(
      tenantId, 
      operatorName, 
      shiftType, 
      parseFloat(initialFloat) || 150
    );
    setShift(created);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !actionType) return;
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) return;

    if (actionType === "sangria") {
      await cashShiftService.addSangria(shift.id, shift, amt, actionReason);
    } else {
      await cashShiftService.addSuprimento(shift.id, shift, amt, actionReason);
    }

    setActionType(null);
    setActionAmount("");
    setActionReason("");
    await loadShift();
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;
    const declared = parseFloat(declaredCash) || 0;
    const closed = await cashShiftService.closeShift(shift.id, shift, declared);
    setClosedSummary(closed);
    setShift(null);
    setIsClosing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Topo */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Gestão de Caixa & Turno (Arqueo)</h2>
              <p className="text-xs text-muted-foreground">Abertura de troco, sangrias e fecho cego do operador</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">A verificar turno ativo...</div>
        ) : closedSummary ? (
          /* RESUMO DE FECHO Z CONCLUÍDO */
          <div className="py-6 space-y-4">
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={24} />
              </span>
              <h3 className="text-lg font-black text-foreground">Turno Fechado com Sucesso!</h3>
              <p className="text-xs text-muted-foreground">Relatório de Arqueo Z registrado no sistema</p>
            </div>

            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operador:</span>
                <span className="font-bold text-foreground">{closedSummary.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fundo Inicial:</span>
                <span className="font-bold">{formatCurrency(closedSummary.initialFloat, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dinheiro Esperado em Caixa:</span>
                <span className="font-black text-foreground">{formatCurrency(closedSummary.expectedCash, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dinheiro Declarado (Contagem):</span>
                <span className="font-black text-foreground">{formatCurrency(closedSummary.declaredCash || 0, currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span className="text-muted-foreground">Diferença de Caixa:</span>
                <span className={`font-black ${
                  (closedSummary.difference || 0) >= 0 ? "text-emerald-500" : "text-destructive"
                }`}>
                  {(closedSummary.difference || 0) >= 0 ? "+" : ""}
                  {formatCurrency(closedSummary.difference || 0, currency)}
                  {(closedSummary.difference || 0) === 0 && " (Caixa Correto!)"}
                </span>
              </div>
            </div>

            <button
              onClick={() => { setClosedSummary(null); onClose(); }}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-md"
            >
              Concluir e Voltar ao PDV
            </button>
          </div>
        ) : !shift ? (
          /* ABERTURA DE TURNO */
          <form onSubmit={handleOpenShift} className="py-6 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-500 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Nenhum turno de caixa aberto no momento. Abra o caixa para operar.</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Nome do Operador *</label>
              <input
                required
                type="text"
                placeholder="Ex: João Silva"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Turno *</label>
                <select
                  value={shiftType}
                  onChange={e => setShiftType(e.target.value as any)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                >
                  <option value="almoco">Almoço</option>
                  <option value="jantar">Jantar</option>
                  <option value="geral">Geral / Dia Inteiro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Fundo de Troco (€) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={initialFloat}
                  onChange={e => setInitialFloat(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all mt-2"
            >
              Abrir Caixa de Turno
            </button>
          </form>
        ) : isClosing ? (
          /* FECHAMENTO CEGO (ARQUEO Z) */
          <form onSubmit={handleCloseShift} className="py-6 space-y-4">
            <div className="text-center">
              <h3 className="text-base font-black text-foreground">Contagem Cega de Caixa (Fecho Z)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Conte o dinheiro físico existente na gaveta e insira o valor total exato.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Dinheiro Físico Contado na Gaveta (€) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={declaredCash}
                onChange={e => setDeclaredCash(e.target.value)}
                className="w-full text-center text-2xl font-black bg-black/5 dark:bg-white/5 border border-border rounded-2xl p-4 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsClosing(false)}
                className="flex-1 py-3 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold text-foreground"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-destructive text-white rounded-xl text-xs font-black shadow-md"
              >
                Confirmar e Encerrar Caixa
              </button>
            </div>
          </form>
        ) : actionType ? (
          /* REGISTRO DE SANGRIA OU SUPRIMENTO */
          <form onSubmit={handleAction} className="py-6 space-y-4">
            <h3 className="text-sm font-black text-foreground capitalize">
              Registar {actionType === "sangria" ? "Sangria (Retirada)" : "Suprimento (Aporte de Troco)"}
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Valor (€) *</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={actionAmount}
                onChange={e => setActionAmount(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Justificativa / Motivo *</label>
              <input
                required
                type="text"
                placeholder={actionType === "sangria" ? "Ex: Envio para cofre" : "Ex: Moedas de troco adicionais"}
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="flex-1 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black"
              >
                Confirmar {actionType}
              </button>
            </div>
          </form>
        ) : (
          /* TURNO ABERTO: STATUS & AÇÕES */
          <div className="py-6 space-y-5">
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Operador:</span>
                <span className="text-xs font-black text-foreground">{shift.operatorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Turno:</span>
                <span className="text-xs font-bold capitalize text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {shift.shiftType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Fundo Inicial:</span>
                <span className="text-xs font-bold">{formatCurrency(shift.initialFloat, currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-xs font-bold text-foreground">Saldo Físico Estimado:</span>
                <span className="text-base font-black text-emerald-500">
                  {formatCurrency(shift.expectedCash, currency)}
                </span>
              </div>
            </div>

            {/* Botões de Ação do Caixa */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActionType("sangria")}
                className="py-3 px-3 bg-card border border-border hover:border-destructive text-foreground rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <ArrowDownCircle size={15} className="text-destructive" />
                Sangria (Retirada)
              </button>

              <button
                onClick={() => setActionType("suprimento")}
                className="py-3 px-3 bg-card border border-border hover:border-emerald-500 text-foreground rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <ArrowUpCircle size={15} className="text-emerald-500" />
                Suprimento (Aporte)
              </button>
            </div>

            <button
              onClick={() => setIsClosing(true)}
              className="w-full py-3.5 bg-destructive/15 border border-destructive/30 hover:bg-destructive hover:text-white text-destructive font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
            >
              Fechar Caixa / Arqueo Z
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
