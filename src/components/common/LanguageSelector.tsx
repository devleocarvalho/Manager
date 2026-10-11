"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Language } from "../../i18n/translations";
import { Globe, ChevronDown } from "lucide-react";

const LANGUAGES: { code: Language; label: string; flag: string; short: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
  { code: "es", label: "Español", flag: "🇪🇸", short: "ES" },
  { code: "pt", label: "Português", flag: "🇵🇹", short: "PT" }
];

export function LanguageSelector({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-2.5 py-2 rounded-xl border border-border bg-card hover:bg-black/5 dark:hover:bg-white/5 text-foreground transition-all flex items-center gap-1.5 shadow-sm text-xs font-bold"
        title="Mudar Idioma / Change Language / Cambiar Idioma"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="font-black text-xs">{current.short}</span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-card border border-border shadow-xl z-50 p-1 animate-in zoom-in-95 duration-150">
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? "bg-primary text-white shadow-sm font-black" 
                    : "text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                <span className={`text-[10px] uppercase font-black ${isSelected ? "text-white" : "text-muted-foreground"}`}>
                  {lang.short}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
