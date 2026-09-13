"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("mg_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default dark
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light") => {
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    } else {
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("mg_theme", nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Mudar para Modo Dia (Claro)" : "Mudar para Modo Noite (Escuro)"}
      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
        theme === "dark"
          ? "bg-white/5 border-white/10 text-amber-400 hover:bg-white/10"
          : "bg-black/5 border-black/10 text-violet-700 hover:bg-black/10 shadow-sm"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun size={18} className="text-amber-400 animate-spin-slow" />
          <span className="hidden sm:inline text-muted-foreground">Modo Dia</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-violet-600" />
          <span className="hidden sm:inline text-muted-foreground">Modo Noite</span>
        </>
      )}
    </button>
  );
}