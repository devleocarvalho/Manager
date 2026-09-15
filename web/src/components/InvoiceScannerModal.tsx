"use client";

import React, { useState, useRef } from "react";
import { 
  QrCode, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Upload, 
  Camera, 
  Copy, 
  Check, 
  RefreshCw,
  AlertTriangle,
  Receipt
} from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { 
  parseNFeXML, 
  buildSampleInvoiceResult, 
  ProcessedInvoiceResult, 
  recalculateSandwichCosts, 
  SAMPLE_INVOICES 
} from "../lib/invoiceParser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceScannerModal({ isOpen, onClose, onSuccess }: Props) {
  const { tenantId } = useAuth();
  const [tab, setTab] = useState<"simulator" | "xml" | "qrcode">("simulator");
  const [processedData, setProcessedData] = useState<ProcessedInvoiceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 1. Simulação com 1-Clique
  const handleSelectSample = (index: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = buildSampleInvoiceResult(index);
      setProcessedData(result);
      setIsProcessing(false);
    }, 400);
  };

  // 2. Upload de Arquivo XML
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseNFeXML(content);
        setProcessedData(result);
      } catch (err) {
        alert("Erro ao ler arquivo XML da NF-e. Verifique se o arquivo é válido.");
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // 3. Leitura de QR Code / Chave de Acesso
  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      // Simula decodificação da chave da SEFAZ
      const result = buildSampleInvoiceResult(0);
      result.supplier = `SEFAZ NFC-e Chave: ${qrCodeInput.slice(0, 20)}...`;
      setProcessedData(result);
      setIsProcessing(false);
    }, 600);
  };

  // 4. Iniciar Câmera do Dispositivo
  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        alert("Não foi possível acessar a câmera do dispositivo.");
      }
    }
  };

  // Edição manual do Insumo Normalizado (De-Para)
  const handleNormalizedChange = (id: string, newTarget: string) => {
    if (!processedData) return;
    const updatedItems = processedData.items.map(it => {
      if (it.id === id) {
        return { ...it, normalizedName: newTarget };
      }
      return it;
    });

    const costUpdates = recalculateSandwichCosts(updatedItems);
    setProcessedData({
      ...processedData,
      items: updatedItems,
      costUpdates,
      integrationJson: {
        estoque: updatedItems.map(it => ({
          produto: it.normalizedName,
          quantidade: it.quantity,
          valor_unitario: it.unitPrice,
          valor_total: it.totalPrice
        })),
        custo_lanches: costUpdates.map(cu => ({
          lanche: cu.sandwichName,
          custo: cu.newCost,
          custo_anterior: cu.previousCost,
          variacao: cu.variationPercentage,
          margem_lucro: cu.newProfitMargin
        }))
      }
    });
  };

  // Gravação em lote no Firestore
  const handleConfirmImport = async () => {
    if (!processedData || !tenantId) return;
    setSavingToDatabase(true);

    try {
      // 1. Cadastrar os insumos no estoque (Coleção inventory_items)
      for (const item of processedData.items) {
        await addDoc(collection(db, "inventory_items"), {
          tenant_id: tenantId,
          name: item.normalizedName,
          lote: `NF-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: item.quantity,
          days_to_expire: 30, // Estimativa padrão
          locator: "Estoque Geral / Freezer",
          cost_price: item.unitPrice,
          supplier: processedData.supplier,
          purchases: [{
            date: new Date().toISOString(),
            supplier: processedData.supplier,
            price: item.unitPrice,
            quantity: item.quantity
          }]
        });
      }

      // 2. Lançamento Automático de CMV no Financeiro
      await addDoc(collection(db, "financial_transactions"), {
        tenant_id: tenantId,
        type: "expense",
        category: "cmv",
        amount: processedData.totalInvoiceAmount,
        description: `Importação NF: ${processedData.supplier} (${processedData.items.length} itens)`,
        date: new Date().toISOString()
      });

      alert("Estoque alimentado e custos de lanches atualizados com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao gravar dados no Firebase.");
    }

    setSavingToDatabase(false);
  };

  const copyJsonToClipboard = () => {
    if (!processedData) return;
    navigator.clipboard.writeText(JSON.stringify(processedData.integrationJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-border shadow-2xl">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 text-primary rounded-2xl">
              <QrCode size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">
                Leitor & Importador de Nota Fiscal (NFC-e / NF-e)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alimente o estoque automaticamente e recalcule o custo de todos os lanches em tempo real.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Corpo com Abas de Entrada */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Seletor de Método de Importação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { setTab("simulator"); setProcessedData(null); }}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                tab === "simulator"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles size={16} />
              1. Simulador Rápido (Exemplos)
            </button>
            <button
              onClick={() => { setTab("xml"); setProcessedData(null); }}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                tab === "xml"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode size={16} />
              2. Upload de Arquivo XML
            </button>
            <button
              onClick={() => { setTab("qrcode"); setProcessedData(null); }}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                tab === "qrcode"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera size={16} />
              3. Câmera / QR Code da Nota
            </button>
          </div>

          {/* CONTEÚDO DA ABA SELECIONADA */}
          {!processedData && (
            <div className="p-6 rounded-2xl bg-card border border-border">
              {tab === "simulator" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    Selecione um Cupom Fiscal de Supermercado para testar o fluxo:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {SAMPLE_INVOICES.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(idx)}
                        disabled={isProcessing}
                        className="p-4 rounded-xl border border-border bg-black/5 dark:bg-white/5 hover:border-primary/50 text-left transition-all hover:scale-[1.02] flex flex-col justify-between"
                      >
                        <span className="font-bold text-xs text-foreground mb-2">{sample.label}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{sample.items.length} produtos na nota</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "xml" && (
                <div className="text-center py-6">
                  <input 
                    type="file" 
                    accept=".xml" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 bg-black/5 dark:bg-white/5"
                  >
                    <Upload size={36} className="text-primary" />
                    <p className="text-sm font-bold text-foreground">
                      Clique para selecionar ou arraste o arquivo XML da NF-e
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Padrão SEFAZ Nacional (.xml com tags de produtos, quantidades e valores)
                    </p>
                  </div>
                </div>
              )}

              {tab === "qrcode" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-muted-foreground">
                      Aponte a câmera para o QR Code impresso no cupom da NFC-e ou cole a URL/Chave:
                    </p>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5"
                    >
                      <Camera size={14} />
                      {cameraActive ? "Desativar Câmera" : "Abrir Câmera do Celular"}
                    </button>
                  </div>

                  {cameraActive && (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center border-2 border-primary">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-4 border-primary/50 border-dashed m-12 rounded-xl pointer-events-none animate-pulse"></div>
                    </div>
                  )}

                  <form onSubmit={handleQrSubmit} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Cole aqui a URL da SEFAZ ou Chave de Acesso de 44 dígitos..." 
                      value={qrCodeInput}
                      onChange={e => setQrCodeInput(e.target.value)}
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25"
                    >
                      Processar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* DADOS PROCESSADOS: TABELA DE NORMALIZAÇÃO + RECÁLCULO DOS LANCHES */}
          {processedData && (
            <div className="space-y-6">
              
              {/* Resumo da Nota */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs text-muted-foreground font-bold uppercase">Emitente / Supermercado:</span>
                  <h4 className="text-base font-black text-foreground">{processedData.supplier}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-bold uppercase">Total da Nota:</span>
                  <p className="text-xl font-black text-success">R$ {processedData.totalInvoiceAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* 1. TABELA DE NORMALIZAÇÃO DE PRODUTOS (DE-PARA) */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Layers size={16} className="text-primary" />
                    1. Mapeamento & Normalização de Insumos (De-Para)
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Verifique os nomes antes de lançar
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                        <th className="pb-2.5">Descrição Original na Nota</th>
                        <th className="pb-2.5">Insumo Normalizado no Manager</th>
                        <th className="pb-2.5 text-center">Qtd</th>
                        <th className="pb-2.5 text-right">Preço Unit.</th>
                        <th className="pb-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {processedData.items.map(item => (
                        <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="py-2.5 font-medium text-muted-foreground pr-3">{item.originalDescription}</td>
                          <td className="py-2.5 pr-3">
                            <input 
                              type="text" 
                              value={item.normalizedName}
                              onChange={e => handleNormalizedChange(item.id, e.target.value)}
                              className="bg-black/5 dark:bg-white/5 border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground w-full focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-2.5 text-center font-bold text-foreground">{item.quantity}</td>
                          <td className="py-2.5 text-right font-semibold text-foreground">R$ {item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-black text-success">R$ {item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. RECÁLCULO AUTOMÁTICO DO CUSTO DOS LANCHES EM TEMPO REAL */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                      <TrendingUp size={16} className="text-success" />
                      2. Recálculo Automático dos Custos dos Lanches
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Atualizado em cascata com base no novo valor dos insumos desta compra.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {processedData.costUpdates.map((cu, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-xs text-foreground">{cu.sandwichName}</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                          cu.variationPercentage.startsWith('+') 
                            ? 'bg-destructive/20 text-destructive' 
                            : 'bg-success/20 text-success'
                        }`}>
                          {cu.variationPercentage}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-border">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Custo Anterior</span>
                          <span className="font-semibold text-foreground">R$ {cu.previousCost.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Novo Custo</span>
                          <span className="font-black text-primary">R$ {cu.newCost.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground block text-[10px]">Margem Atual</span>
                          <span className="font-black text-success">{cu.newProfitMargin}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. JSON ESTRUTURADO PARA INTEGRAÇÃO */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">JSON Estruturado da Operação:</span>
                  <button
                    onClick={copyJsonToClipboard}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    {copiedJson ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    {copiedJson ? "Copiado!" : "Copiar JSON"}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-black/40 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-40">
                  {JSON.stringify(processedData.integrationJson, null, 2)}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Footer com Ações */}
        <div className="p-5 border-t border-border bg-card flex justify-between items-center">
          {processedData ? (
            <button
              onClick={() => setProcessedData(null)}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              ← Ler Outra Nota
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            {processedData && (
              <button
                onClick={handleConfirmImport}
                disabled={savingToDatabase}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {savingToDatabase ? "Alimentando Estoque..." : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirmar e Gravar no Estoque
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}