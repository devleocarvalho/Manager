"use client";

import React from "react";
import { QrCode, Printer, X, ExternalLink } from "lucide-react";
import { TableItem } from "../../domain/types";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableItem[];
  tenantId: string;
  businessName: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  tables,
  tenantId,
  businessName
}: QrCodeModalProps) {
  if (!isOpen) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://meuqueridogerente.web.app";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Topo */}
        <div className="p-6 border-b border-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <QrCode size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                Plaquinhas com QR Code das Mesas
              </h2>
              <p className="text-xs text-muted-foreground">
                Imprima para os clientes acederem ao cardápio e pedirem pelo smartphone sem login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Printer size={16} /> Imprimir (A4)
            </button>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Grade de Plaquinhas A4 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {tables.map(table => {
              const url = `${baseUrl}/cardapio?tenant=${tenantId}&mesa=${table.number}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=0f172a`;

              return (
                <div
                  key={table.id}
                  className="bg-white text-slate-900 border-2 border-slate-300 rounded-3xl p-5 flex flex-col items-center text-center shadow-md print:border-dashed print:shadow-none"
                >
                  <div className="w-full flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      {businessName || "Meu Restaurante"}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Cardápio Digital
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-1">{table.name}</h3>
                  <p className="text-xs text-slate-600 mb-3 font-medium">
                    Aponte a câmara para pedir ou chamar o garçom
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-3 shadow-inner">
                    <img
                      src={qrUrl}
                      alt={`QR Code ${table.name}`}
                      className="w-36 h-36 object-contain"
                      loading="lazy"
                    />
                  </div>

                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 print:hidden"
                  >
                    Testar Link <ExternalLink size={11} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground print:hidden">
          <span>Dica: Imprima em papel fotográfico ou plastifique para maior durabilidade.</span>
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-xl font-bold">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
