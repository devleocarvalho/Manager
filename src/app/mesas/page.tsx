"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useTables } from "../../hooks/useTables";
import { menuService } from "../../services/menuService";
import { TableItem, MenuItem } from "../../domain/types";
import { formatCurrency } from "../../lib/currency";
import { TableCard } from "../../components/tables/TableCard";
import { TableDrawer } from "../../components/tables/TableDrawer";
import { OpenTableModal } from "../../components/tables/OpenTableModal";
import { CloseBillModal } from "../../components/tables/CloseBillModal";
import { QrCodeModal } from "../../components/tables/QrCodeModal";
import { UtensilsCrossed, Plus, QrCode } from "lucide-react";

export default function MesasPage() {
  const { tenantId, currency, tenantProfile } = useAuth();
  const { 
    tables, 
    loading, 
    openTable, 
    addItem, 
    removeItem, 
    sendToKitchen, 
    closeBill, 
    createTable 
  } = useTables(tenantId);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [filter, setFilter] = useState<"todas" | "livres" | "ocupadas">("todas");

  // Modais
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = menuService.subscribeMenu(tenantId, setMenuItems);
    return () => unsub();
  }, [tenantId]);

  // Atualiza mesa selecionada quando houver alterações no Firestore
  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  const filteredTables = tables.filter(t => {
    if (filter === "livres") return t.status === "livre";
    if (filter === "ocupadas") return t.status !== "livre";
    return true;
  });

  const totalConsumo = tables.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const mesasOcupadas = tables.filter(t => t.status !== "livre").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Gestão de Mesas & Salão</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Atendimento, comandas ativas, envio para a cozinha e fechamento ágil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <QrCode size={16} /> Plaquinhas QR Code
            </button>
            <button
              onClick={() => createTable(tables.length + 1, `Mesa ${tables.length + 1}`, 4)}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus size={16} /> + Nova Mesa
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Métricas do Salão */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Mesas Cadastradas</span>
            <div className="text-2xl font-black text-foreground mt-1">{tables.length}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-500 uppercase">Mesas Ocupadas</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{mesasOcupadas}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-success uppercase">Mesas Livres</span>
            <div className="text-2xl font-black text-success mt-1">{tables.length - mesasOcupadas}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-primary uppercase">Consumo Aberto</span>
            <div className="text-2xl font-black text-primary mt-1">{formatCurrency(totalConsumo, currency)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6">
          {(["todas", "ocupadas", "livres"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grade de Mesas */}
        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">A carregar mesas...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTables.map(t => (
              <TableCard
                key={t.id}
                table={t}
                currency={currency}
                onClick={() => {
                  setSelectedTable(t);
                  if (t.status === "livre") setShowOpenModal(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Drawer da Comanda */}
        {selectedTable && selectedTable.status !== "livre" && (
          <TableDrawer
            table={selectedTable}
            currency={currency}
            menuItems={menuItems}
            onClose={() => setSelectedTable(null)}
            onAddItem={(item) => addItem(selectedTable, item)}
            onRemoveItem={(itemId) => removeItem(selectedTable, itemId)}
            onSendToKitchen={() => sendToKitchen(selectedTable).then(() => {})}
            onOpenCloseBill={() => setShowCloseModal(true)}
          />
        )}

        {/* Modais */}
        {selectedTable && showOpenModal && (
          <OpenTableModal
            isOpen={showOpenModal}
            table={selectedTable}
            onClose={() => setShowOpenModal(false)}
            onConfirm={(name, phone, nif) => openTable(selectedTable.id, name, phone, nif).then(() => {})}
          />
        )}

        {selectedTable && showCloseModal && (
          <CloseBillModal
            isOpen={showCloseModal}
            table={selectedTable}
            currency={currency}
            onClose={() => setShowCloseModal(false)}
            onConfirm={(amount, method, vat) => closeBill(selectedTable, amount, method, vat).then(() => setSelectedTable(null))}
          />
        )}

        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          tables={tables}
          tenantId={tenantId}
          businessName={tenantProfile?.businessName || "Meu Restaurante"}
        />
      </main>
    </div>
  );
}
