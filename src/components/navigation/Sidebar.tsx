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
  Smartphone
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../common/ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenantProfile, logout, subscription } = useAuth();

  const navItems = [
    { name: "Cockpit", href: "/", icon: TrendingUp },
    { name: "Mesas & Salão", href: "/mesas", icon: UtensilsCrossed },
    { name: "Modo Garçom", href: "/garcom", icon: Smartphone },
    { name: "PDV (Caixa)", href: "/pdv", icon: ShoppingCart },
    { name: "Cozinha (KDS)", href: "/cozinha", icon: ChefHat },
    { name: "Estoque", href: "/estoque", icon: Package },
    { name: "Financeiro & DRE", href: "/financeiro", icon: Wallet },
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
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all ${
                  isActive 
                    ? "text-white bg-primary shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border flex flex-col gap-3">
        {user && (
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-foreground truncate max-w-[130px]">
                {tenantProfile?.businessName || "Meu Restaurante"}
              </span>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                EUR (€)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
              <span className="truncate mr-2">{user.email}</span>
              <button 
                onClick={() => logout()}
                className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                title="Encerrar sessão"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        <ThemeToggle className="w-full" />
      </div>
    </aside>
  );
}
