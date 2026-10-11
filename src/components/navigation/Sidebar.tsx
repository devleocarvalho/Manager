"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingCart, 
  UtensilsCrossed, 
  ChefHat, 
  Package, 
  Layers, 
  Target, 
  Wallet, 
  BarChart3, 
  Store, 
  LogOut, 
  Sparkles,
  Smartphone,
  CalendarCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageSelector } from "../common/LanguageSelector";

export function Sidebar() {
  const pathname = usePathname();
  const { user, isDemoMode, tenantProfile, logout, subscription } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { name: t.nav.cockpit, href: "/", icon: TrendingUp },
    { name: t.nav.analytics, href: "/analytics", icon: BarChart3 },
    { name: t.nav.reservations, href: "/reservas", icon: CalendarCheck },
    { name: t.nav.tables, href: "/mesas", icon: UtensilsCrossed },
    { name: t.nav.waiterMode, href: "/garcom", icon: Smartphone },
    { name: t.nav.pos, href: "/pdv", icon: ShoppingCart },
    { name: t.nav.kitchen, href: "/cozinha", icon: ChefHat },
    { name: t.nav.inventory, href: "/estoque", icon: Package },
    { name: t.nav.finance, href: "/financeiro", icon: Wallet },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col p-6 min-h-screen justify-between shadow-sm">
      <div>
        <div className="flex items-center gap-3 mb-8 text-primary">
          <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
            <Store size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight leading-none">
              Mana<span className="text-primary">ger</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Restaurant OS
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive 
                    ? "text-white bg-primary shadow-lg shadow-primary/25" 
                    : "text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-white" : "text-primary"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border flex flex-col gap-3">
        {(user || isDemoMode) && (
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-black text-foreground truncate max-w-[130px]">
                {tenantProfile?.businessName || (isDemoMode ? "Restaurante Lisboa Demo" : "Meu Restaurante")}
              </span>
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-primary/20 text-primary">
                EUR (€)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border">
              <span className="truncate mr-2 font-medium">{user?.email || "Modo Demonstração"}</span>
              <button 
                onClick={() => logout()}
                className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                title="Encerrar sessão"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <LanguageSelector className="flex-1" />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
