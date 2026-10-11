"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, Translations } from "../i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  getDayName: (dayIndex: number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
  getDayName: (dayIndex: number) => translations.en.days[dayIndex as keyof typeof translations.en.days] || ""
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // 1. Verifica parâmetro na URL (?lang=es / ?lang=en / ?lang=pt)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang")?.toLowerCase() as Language | null;
      if (urlLang && (urlLang === "pt" || urlLang === "es" || urlLang === "en")) {
        setLanguageState(urlLang);
        localStorage.setItem("meugerente_lang", urlLang);
        return;
      }

      // 2. Verifica armazenamento local
      const savedLang = localStorage.getItem("meugerente_lang") as Language | null;
      if (savedLang && (savedLang === "pt" || savedLang === "es" || savedLang === "en")) {
        setLanguageState(savedLang);
        return;
      }

      // 3. Padrão global é Inglês (en)
      setLanguageState("en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("meugerente_lang", lang);
      document.documentElement.lang = lang === "en" ? "en" : lang === "es" ? "es" : "pt-PT";
    }
  };

  const currentTranslations = translations[language] || translations.pt;

  const getDayName = (dayIndex: number) => {
    return currentTranslations.days[dayIndex as keyof typeof currentTranslations.days] || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: currentTranslations, getDayName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
