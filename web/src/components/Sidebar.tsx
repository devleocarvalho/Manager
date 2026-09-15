"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  Layers, 
  Wallet, 
  Store, 
  Package, 
  ShoppingCart, 
  Target, 
  ChefHat, 
  BarChart3, 
  UtensilsCrossed,
  LogOut,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenantProfile, subscription, logout } = useAuth();

  const navItems = [
    { name: "Cockpit", href: "/", icon: TrendingUp },
    { name: "PDV (Caixa)", href: "/pdv", icon: ShoppingCart },
    { name: "Mesas & Comandas", href: "/mesas", icon: UtensilsCrossed },
    { name: "Cozinha (KDS)", href: "/cozinha", icon: ChefHat },
    { name: "Estoque", href: "/estoque", icon: Package },
    { name: "Composições", href: "/fichas-tecnicas", icon: Layers },
    { name: "Meta do Dia", href: "/meta-do-dia", icon: Target },
    { name: "Financeiro", href: "/financeiro", icon: Wallet },
    { name: "Relatórios & Previsão", href: "/relatorios", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 glass border-r border-border hidden md:flex flex-col p-6 min-h-screen justify-between">
      <div>
        <div className="flex items-center justify-between mb-8 text-primary">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <Store size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight leading-none">
                Mana<span className="text-primary">ger</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                SaaS Multi-Tenant
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SyncStatusBadge />
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium text-sm transition-all ${
                  isActive 
                    ? "text-primary-foreground bg-primary shadow-lg shadow-primary/25 font-bold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <item.icon size={19} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Assinante e Logout */}
      <div className="pt-4 border-t border-border mt-6 flex flex-col gap-3">
        {user && (
          <div className="p-3 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-foreground truncate max-w-[130px]">
                {tenantProfile?.businessName || user.email?.split("@")[0] || "Meu Negócio"}
              </span>
              <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                subscription.status === "active" 
                  ? "bg-success/20 text-success" 
                  : "bg-amber-500/20 text-amber-500"
              }`}>
                {subscription.status === "active" ? "Pro" : `Trial ${subscription.daysRemaining}d`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
              <span className="truncate mr-2">{user.email}</span>
              <button 
                onClick={() => logout()}
                className="p-1 hover:text-destructive transition-colors text-muted-foreground"
                title="Encerrar sessão"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        <ThemeToggle className="w-full justify-center" />
      </div>
    </aside>
  );
}
