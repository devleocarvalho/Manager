"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { History, Package, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function InventoryList() {
  const { tenantId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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
      }));
      setItems(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <>
      <div className="glass-panel p-6">
        <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
          <Package size={22} className="text-primary" />
          Estoque Atual
        </h3>

        {loading ? (
          <p className="text-muted-foreground text-xs">Carregando estoque...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nenhum item no estoque.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                  <th className="pb-3 font-bold">Insumo</th>
                  <th className="pb-3 font-bold">Lote / Local</th>
                  <th className="pb-3 font-bold text-center">Qtd</th>
                  <th className="pb-3 font-bold text-right">Custo Atual</th>
                  <th className="pb-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 text-foreground font-bold">{item.name}</td>
                    <td className="py-3 text-muted-foreground text-xs">
                      Lote: <strong className="text-foreground">{item.lote}</strong> <br/>
                      <span className="text-[11px] text-muted-foreground">{item.locator}</span>
                    </td>
                    <td className="py-3 text-center text-foreground font-bold">
                      {item.quantity} <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{item.unit || "un"}</span>
                    </td>
                    <td className="py-3 text-right text-success font-black">
                      R$ {Number(item.cost_price).toFixed(2)} <span className="text-[10px] text-muted-foreground font-normal">/ {item.unit || "un"}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="p-2 bg-secondary text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors inline-flex border border-border"
                        title="Histórico de Compras"
                      >
                        <History size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Histórico de Compras */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass rounded-3xl w-full max-w-2xl overflow-hidden border border-border shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <History size={22} className="text-primary" />
                Histórico de Preços: {selectedItem.name}
              </h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedItem.purchases || selectedItem.purchases.length === 0 ? (
                <p className="text-muted-foreground text-xs">Nenhum histórico de compra para este item.</p>
              ) : (
                <div className="space-y-3">
                  {selectedItem.purchases.map((compra: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                      <div>
                        <p className="font-bold text-foreground text-xs">{compra.supplier}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(compra.date).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-foreground text-xs">R$ {Number(compra.price).toFixed(2)} / {compra.unit || selectedItem.unit || 'un'}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Qtd: {compra.quantity} {compra.unit || selectedItem.unit || 'un'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-card border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-card border border-border text-foreground rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
