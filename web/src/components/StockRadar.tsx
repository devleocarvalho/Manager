"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Clock, CheckCircle2, MapPin } from "lucide-react";

export function StockRadar() {
  const { tenantId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "inventory_items"),
      where("tenant_id", "==", tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      // Ordenação local pelo FEFO (menor days_to_expire primeiro)
      docs.sort((a, b) => (a.days_to_expire || 0) - (b.days_to_expire || 0));
      setItems(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  if (loading) {
    return (
      <section className="glass rounded-2xl p-6">
        <h3 className="text-lg font-black text-foreground mb-6">Radar FEFO (Validades e Localizadores)</h3>
        <p className="text-muted-foreground text-xs">Carregando estoque do Firebase...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="glass rounded-2xl p-6">
        <h3 className="text-lg font-black text-foreground mb-6">Radar FEFO (Validades e Localizadores)</h3>
        <p className="text-muted-foreground text-xs">Nenhum item no estoque ainda.</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-foreground">Radar FEFO (Validades)</h3>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => {
          const days = item.days_to_expire || 0;
          let theme = "success";
          let Icon = CheckCircle2;

          if (days <= 3) {
            theme = "destructive";
            Icon = AlertTriangle;
          } else if (days <= 7) {
            theme = "warning";
            Icon = Clock;
          }

          let promoSuggestion = null;
          if (item.cost_price) {
            const cost = Number(item.cost_price);
            if (days <= 3) {
              promoSuggestion = `👨‍💼 Dica do Manager: Lojista, esse produto vence muito em breve! Coloque em promoção hoje por R$ ${cost.toFixed(2)} para empatar nosso custo e fugirmos do prejuízo por desperdício.`;
            } else if (days <= 7) {
              const suggestedPrice = cost * 1.15;
              promoSuggestion = `👨‍💼 Dica do Manager: A validade está começando a apertar. Sugiro criarmos uma promoção do produto cobrando R$ ${suggestedPrice.toFixed(2)} (Recupera custo + 15%). Assim o estoque gira rápido!`;
            }
          }

          return (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${
                  theme === 'destructive' ? 'bg-destructive/20 text-destructive' :
                  theme === 'warning' ? 'bg-warning/20 text-warning' :
                  'bg-success/20 text-success'
                }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{item.name} (Lote #{item.lote})</h4>
                  <p className={`text-xs font-semibold mt-0.5 ${
                    theme === 'destructive' ? 'text-destructive' :
                    theme === 'warning' ? 'text-warning' :
                    'text-success'
                  }`}>
                    Vence em {days} dias • {item.quantity} restantes
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={12} /> Local: {item.locator || 'Não especificado'}
                  </p>
                  {promoSuggestion && (
                    <div className="mt-2 text-xs font-semibold text-foreground/90 bg-primary/10 p-2.5 rounded-lg border border-primary/20">
                      {promoSuggestion}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
