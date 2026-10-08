"use client";

import React, { useState } from "react";
import { X, CreditCard, Banknote, QrCode, CheckCircle2, Users } from "lucide-react";
import { TableItem, CurrencyCode } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";

interface CloseBillModalProps {
  isOpen: boolean;
  table: TableItem;
  currency: CurrencyCode;
  onClose: () => void;
  onConfirm: (finalAmount: number, paymentMethod: string, vatAmount: number) => Promise<void>;
}

export function CloseBillModal({
  isOpen,
  table,
  currency,
  onClose,
  onConfirm
}: CloseBillModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cartao" | "dinheiro" | "digital">("cartao");
  const [splitCount, setSplitCount] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const subtotal = table.totalAmount || 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const perPerson = splitCount > 1 ? finalTotal / splitCount : finalTotal;
  // Estimativa de IVA (ex: 13% restaurante padrão)
  const estimatedVat = Number((finalTotal * 0.13 / 1.13).toFixed(2));

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onConfirm(finalTotal, paymentMethod, estimatedVat);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-6 border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-lg font-black text-foreground">Encerrar {table.name}</h3>
            <p className="text-xs text-muted-foreground">{table.customerName || "Cliente"}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Métodos de Pagamento Europeus */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setPaymentMethod("cartao")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === "cartao" 
                    ? "bg-primary text-white border-primary font-bold shadow-md" 
                    : "bg-black/5 dark:bg-white/5 border-border text-foreground"
                }`}
              >
                <CreditCard size={18} className="mx-auto mb-1" />
                <span className="text-xs">Cartão / Contactless</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod("dinheiro")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === "dinheiro" 
                    ? "bg-primary text-white border-primary font-bold shadow-md" 
                    : "bg-black/5 dark:bg-white/5 border-border text-foreground"
                }`}
              >
                <Banknote size={18} className="mx-auto mb-1" />
                <span className="text-xs">Numerário (€)</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod("digital")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === "digital" 
                    ? "bg-primary text-white border-primary font-bold shadow-md" 
                    : "bg-black/5 dark:bg-white/5 border-border text-foreground"
                }`}
              >
                <QrCode size={18} className="mx-auto mb-1" />
                <span className="text-xs">Digital / MB WAY</span>
              </button>
            </div>
          </div>

          {/* Divisão de Conta (Split Bill) */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Dividir Conta (Split Bill)
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      splitCount === num ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
            {splitCount > 1 && (
              <p className="text-[11px] text-primary font-semibold">
                Cada pessoa paga: <strong>{formatCurrency(perPerson, currency)}</strong>
              </p>
            )}
          </div>

          {/* Resumo com IVA */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>IVA Estimado (Incluído):</span>
              <span>{formatCurrency(estimatedVat, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
              <span>Total Final:</span>
              <span className="text-success">{formatCurrency(finalTotal, currency)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-foreground"
            >
              Voltar
            </button>
            <button 
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black hover:bg-success/90 shadow-md shadow-success/25 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {loading ? "A processar..." : "Confirmar e Libertar Mesa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
