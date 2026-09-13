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
  BarChart3
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SyncStatusBadge } from "./SyncStatusBadge";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Cockpit", href: "/", icon: TrendingUp },
    { name: "PDV (Caixa)", href: "/pdv", icon: ShoppingCart },
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
            <h1 className="text-xl font-black text-foreground tracking-tight">
              Mana<span className="text-primary">ger</span>
            </h1>
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

      <div className="pt-4 border-t border-border mt-6 flex flex-col gap-3">
        <ThemeToggle className="w-full justify-center" />
      </div>
    </aside>
  );
}

