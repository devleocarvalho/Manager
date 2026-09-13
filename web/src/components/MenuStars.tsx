"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TrendingUp } from "lucide-react";

export function MenuStars() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "menu_items"),
      where("tenant_id", "==", "tenant-demo")
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
  }, []);

  if (loading) {
    return (
      <section className="glass rounded-2xl p-6">
        <h3 className="text-lg font-black text-foreground mb-6">Estrelas do Cardápio</h3>
        <p className="text-muted-foreground text-xs">Carregando cardápio do Firebase...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="glass rounded-2xl p-6">
        <h3 className="text-lg font-black text-foreground mb-6">Estrelas do Cardápio</h3>
        <p className="text-muted-foreground text-xs">Nenhum item cadastrado no cardápio.</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-6">
      <h3 className="text-lg font-black text-foreground mb-6">Estrelas do Cardápio</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const isAltaMargem = item.cmv <= 30;
          
          return (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base shadow-sm ${
                  isAltaMargem ? 'bg-gradient-to-tr from-primary to-accent' : 'bg-gradient-to-tr from-orange-500 to-red-500'
                }`}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                  <p className={`text-xs flex items-center gap-1 mt-1 font-semibold ${isAltaMargem ? 'text-success' : 'text-warning'}`}>
                    <TrendingUp size={12} /> {isAltaMargem ? 'Alta Saída • Alta Margem' : 'Alta Saída • Baixa Margem'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-base font-black text-foreground">R$ {item.price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground font-medium">CMV: {item.cmv}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
