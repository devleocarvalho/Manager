import { CurrencyCode } from "../domain/types";

/**
 * Formata valores monetários no padrão europeu (EUR €) ou local configurado
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = "EUR",
  locale: string = "pt-PT"
): string {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safe);
  } catch (e) {
    const sym = currency === "EUR" ? "€" : currency === "BRL" ? "R$" : "$";
    return `${sym} ${safe.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currency: CurrencyCode = "EUR"): string {
  switch (currency) {
    case "EUR": return "€";
    case "BRL": return "R$";
    case "USD": return "$";
    default: return "€";
  }
}
