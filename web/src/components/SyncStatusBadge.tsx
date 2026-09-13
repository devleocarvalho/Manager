"use client";

import React, { useEffect, useState } from "react";
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Layers, 
  X,
  Database
} from "lucide-react";
import { syncEngine, ConnectivityState } from "../lib/syncEngine";

export function SyncStatusBadge() {
  const [state, setState] = useState<ConnectivityState>({
    isOnline: true,
    pendingSyncCount: 0,
    lastSyncTime: null,
    mode: "cloud"
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.onConnectivityChange((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const synced = await syncEngine.flushOutbox();
      if (synced > 0) {
        alert(`Sucesso! ${synced} operação(ões) local(is) foram enviadas para a nuvem.`);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSyncing(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          state.isOnline && state.pendingSyncCount === 0
            ? "bg-success/10 border-success/30 text-success hover:bg-success/20"
            : !state.isOnline
            ? "bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25 animate-pulse"
            : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
        }`}
        title="Status de Conectividade e Sincronização Híbrida"
      >
        {state.isOnline ? (
          state.pendingSyncCount === 0 ? (
            <>
              <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
              <Cloud size={14} />
              <span className="hidden sm:inline">Nuvem Conectada</span>
            </>
          ) : (
            <>
              <RefreshCw size={13} className="animate-spin text-primary" />
              <span>Sincronizando ({state.pendingSyncCount})</span>
            </>
          )
        ) : (
          <>
            <CloudOff size={14} className="text-amber-500" />
            <span>Modo Local (Offline: {state.pendingSyncCount})</span>
          </>
        )}
      </button>

      {/* Modal de Diagnóstico de Sincronização */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass rounded-3xl w-full max-w-lg overflow-hidden border border-border shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Motor Híbrido: Local + Nuvem
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tolerância a falhas para operar 100% offline.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
                  <span className="text-muted-foreground text-[11px] font-bold block">Status da Internet</span>
                  <div className="flex items-center gap-2 mt-1">
                    {state.isOnline ? (
                      <>
                        <Wifi size={16} className="text-success" />
                        <span className="font-bold text-success text-xs">Conectado (Online)</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={16} className="text-amber-500" />
                        <span className="font-bold text-amber-500 text-xs">Desconectado (Offline)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border">
                  <span className="text-muted-foreground text-[11px] font-bold block">Operações na Fila Local</span>
                  <div className="flex items-center gap-2 mt-1">
                    <HardDrive size={16} className="text-primary" />
                    <span className="font-black text-foreground text-xs">
                      {state.pendingSyncCount} pendente(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground/90 leading-relaxed">
                <p className="font-bold text-primary mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Como seu comércio é protegido:
                </p>
                Se a internet da loja cair, o Caixa (PDV) e a Cozinha (KDS) continuam vendendo e preparando pedidos normalmente através da rede local. Quando a internet voltar, tudo sobe para a nuvem automaticamente!
              </div>

              {state.lastSyncTime && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Última sincronização bem-sucedida: {new Date(state.lastSyncTime).toLocaleTimeString("pt-BR")}
                </p>
              )}
            </div>

            <div className="p-4 bg-card border-t border-border flex justify-between items-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border text-foreground rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
              >
                Fechar
              </button>
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !state.isOnline}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}