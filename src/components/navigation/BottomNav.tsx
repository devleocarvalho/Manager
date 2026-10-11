"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingCart, 
  UtensilsCrossed, 
  ChefHat, 
  Smartphone, 
  Menu, 
  X, 
  Package, 
  Wallet, 
  LogOut,
  CalendarCheck 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageSelector } from "../common/LanguageSelector";

export function BottomNav() {
  const pathname = usePathname();
  const { logout, tenantProfile } = useAuth();
  const { t } = useLanguage();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Não exibe em rotas públicas ou login
  if (pathname === "/login" || pathname.startsWith("/cardapio") || pathname.startsWith("/reservar")) {
    return null;
  }

  const items = [
    { name: t.nav.cockpit, href: "/", icon: TrendingUp },
    { name: t.nav.tables, href: "/mesas", icon: UtensilsCrossed },
    { name: t.nav.waiterMode, href: "/garcom", icon: Smartphone },
    { name: t.nav.pos, href: "/pdv", icon: ShoppingCart },
    { name: t.nav.kitchen, href: "/cozinha", icon: ChefHat },
  ];

  return (
    <>
      {/* Modal / Menu Mais */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden flex flex-col justify-end">
          <div className="bg-card border-t border-border rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-black text-foreground text-base">{t.nav.moreFunctions}</h3>
                <p className="text-xs text-muted-foreground">{tenantProfile?.businessName || (t.common.demoMode)}</p>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full bg-black/5 dark:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/reservas"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-black text-primary col-span-2"
              >
                <CalendarCheck size={16} /> {t.nav.reservations}
              </Link>
              <Link
                href="/analytics"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs font-bold text-foreground col-span-2"
              >
                <TrendingUp size={16} /> {t.nav.analytics}
              </Link>
              <Link
                href="/estoque"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs font-bold text-foreground"
              >
                <Package size={16} /> {t.nav.inventory}
              </Link>
              <Link
                href="/financeiro"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs font-bold text-foreground"
              >
                <Wallet size={16} /> {t.nav.finance}
              </Link>
            </div>

            <div className="pt-3 border-t border-border flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <LanguageSelector className="flex-1" />
                <ThemeToggle />
              </div>
              <button
                onClick={() => { setShowMoreMenu(false); logout(); }}
                className="flex items-center justify-center gap-2 text-xs font-bold text-destructive py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors w-full"
              >
                <LogOut size={15} /> {t.common.endSession}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior Fixa Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-1.5 md:hidden shadow-2xl flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? "text-primary font-black scale-105" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center justify-center py-1 px-2 text-muted-foreground hover:text-foreground"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">{t.nav.moreFunctions}</span>
        </button>
      </nav>
    </>
  );
}
