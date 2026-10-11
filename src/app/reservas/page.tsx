"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/navigation/Sidebar";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useTables } from "../../hooks/useTables";
import { 
  Reservation, 
  ReservationStatus, 
  OperatingSchedule, 
  ShiftType 
} from "../../domain/types";
import { 
  reservationService, 
  DEFAULT_OPERATING_SCHEDULE, 
  DAY_NAMES 
} from "../../services/reservationService";
import { ScheduleConfigModal } from "../../components/reservations/ScheduleConfigModal";
import { NewReservationModal } from "../../components/reservations/NewReservationModal";
import { CheckInModal } from "../../components/reservations/CheckInModal";
import { 
  CalendarCheck, 
  Plus, 
  Settings, 
  Share2, 
  Users, 
  Clock, 
  Calendar, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  UtensilsCrossed, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSelector } from "../../components/common/LanguageSelector";

export default function ReservasPage() {
  const { tenantId, tenantProfile } = useAuth();
  const { t, getDayName } = useLanguage();
  const { tables } = useTables(tenantId);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [schedule, setSchedule] = useState<OperatingSchedule>(DEFAULT_OPERATING_SCHEDULE);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<"todas" | ReservationStatus>("todas");
  const [filterShift, setFilterShift] = useState<"todos" | ShiftType>("todos");

  // Modais
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [checkInReservation, setCheckInReservation] = useState<Reservation | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Carrega configurações de dias e horários
  useEffect(() => {
    if (!tenantId) return;
    const loadSchedule = async () => {
      const sch = await reservationService.getOperatingSchedule(tenantId);
      setSchedule(sch);
    };
    loadSchedule();
  }, [tenantId]);

  // Escuta reservas da data selecionada em tempo real
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const unsub = reservationService.subscribeReservations(tenantId, selectedDate, (list) => {
      setReservations(list);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId, selectedDate]);

  // Checagem se data atual é aberta
  const isOpenDay = reservationService.isDateOpen(selectedDate, schedule);
  const dateParts = selectedDate.split("-").map(Number);
  const selectedDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
  const dayName = getDayName(selectedDateObj.getDay());

  // Navegação de dias
  const changeDay = (days: number) => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Filtragem
  const filtered = reservations.filter(r => {
    const matchStatus = filterStatus === "todas" ? true : r.status === filterStatus;
    const matchShift = filterShift === "todos" ? true : r.shift === filterShift;
    return matchStatus && matchShift;
  });

  // Métricas
  const totalReservas = reservations.length;
  const totalPessoas = reservations.reduce((s, r) => s + (r.guestsCount || 0), 0);
  const reservasSentadas = reservations.filter(r => r.status === "sentada").length;
  const reservasPendentes = reservations.filter(r => r.status === "pendente").length;

  // Link público para os clientes / Google
  const publicReservationUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/reservar?tenant=${tenantId}`
    : `https://meugerente.app/reservar?tenant=${tenantId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicReservationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleUpdateStatus = async (resId: string, newStatus: ReservationStatus) => {
    try {
      await reservationService.updateReservationStatus(resId, newStatus);
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <CalendarCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">{t.reservations.title}</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                {t.reservations.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-all text-primary"
              title="Google Maps / WhatsApp"
            >
              <Share2 size={16} /> {t.reservations.linkGoogleBtn}
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Settings size={16} /> {t.reservations.companyScheduleBtn}
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus size={16} /> {t.reservations.newReservationBtn}
            </button>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* Métricas do Dia */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t.reservations.metricsDayTotal}</span>
            <div className="text-3xl font-black text-foreground mt-1.5">{totalReservas}</div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-primary uppercase tracking-wider">{t.reservations.metricsGuestsTotal}</span>
            <div className="text-3xl font-black text-primary mt-1.5">{totalPessoas} {t.common.people}</div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-success uppercase tracking-wider">{t.reservations.metricsSeatedTotal}</span>
            <div className="text-3xl font-black text-success mt-1.5">{reservasSentadas} {t.reservations.statusSeated.toLowerCase()}</div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider">{t.reservations.metricsPendingTotal}</span>
            <div className="text-3xl font-black text-amber-500 mt-1.5">{reservasPendentes} {t.reservations.statusPending.toLowerCase()}</div>
          </div>
        </div>

        {/* Seletor de Data e Status de Funcionamento */}
        <div className="bg-card border border-border p-4 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-2 rounded-xl border border-border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
              title="Dia anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-black text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-xs font-extrabold text-foreground px-2">
                {dayName}
              </span>
            </div>

            <button
              onClick={() => changeDay(1)}
              className="p-2 rounded-xl border border-border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
              title="Próximo dia"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-bold text-primary hover:underline px-2"
            >
              {t.common.today}
            </button>
          </div>

          {/* Indicativo de status do restaurante no dia */}
          <div>
            {isOpenDay ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 text-success text-xs font-black border border-success/30">
                <CheckCircle2 size={14} /> {t.reservations.restaurantOpenToday}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive text-xs font-black border border-destructive/30">
                <AlertTriangle size={14} /> {t.reservations.restaurantClosedToday}
              </span>
            )}
          </div>
        </div>

        {/* Filtros de Turno e Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-muted-foreground mr-1">{t.common.shift}:</span>
            {[
              { key: "todos", label: t.common.all.toUpperCase() },
              { key: "almoco", label: t.common.lunch.toUpperCase() },
              { key: "jantar", label: t.common.dinner.toUpperCase() }
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setFilterShift(s.key as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterShift === s.key 
                    ? "bg-foreground text-background shadow-sm" 
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { key: "todas", label: t.common.all },
              { key: "confirmada", label: t.reservations.statusConfirmed },
              { key: "pendente", label: t.reservations.statusPending },
              { key: "sentada", label: t.reservations.statusSeated },
              { key: "cancelada", label: t.reservations.statusCanceled }
            ].map(st => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all capitalize ${
                  filterStatus === st.key 
                    ? "bg-primary text-white shadow-sm font-black" 
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Reservas */}
        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <CalendarCheck size={40} className="mx-auto text-muted-foreground mb-3 opacity-40" />
            <h4 className="text-base font-black text-foreground">{t.reservations.noReservationsFound}</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t.reservations.noReservationsDesc}
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/25 hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> {t.reservations.createNow}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(res => {
              const isSeated = res.status === "sentada";
              const isCanceled = res.status === "cancelada";

              return (
                <div
                  key={res.id}
                  className={`bg-card border rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                    isSeated ? "border-success/50 bg-success/5" :
                    isCanceled ? "border-destructive/30 opacity-60" :
                    "border-border hover:border-primary/50"
                  }`}
                >
                  <div>
                    {/* Linha 1: Horário, Turno e Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-foreground flex items-center gap-1.5">
                          <Clock size={18} className="text-primary" /> {res.time}
                        </span>
                        <span className="text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 text-foreground">
                          {res.shift === "almoco" ? "Almoço" : "Jantar"}
                        </span>
                      </div>

                      <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                        res.status === "confirmada" ? "bg-primary/20 text-primary border border-primary/30" :
                        res.status === "sentada" ? "bg-success/20 text-success border border-success/30" :
                        res.status === "pendente" ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                        "bg-destructive/20 text-destructive border border-destructive/30"
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    {/* Linha 2: Nome e Convidados */}
                    <div className="flex items-baseline justify-between mb-2.5">
                      <h3 className="text-lg font-black text-foreground truncate mr-2">
                        {res.customerName}
                      </h3>
                      <span className="text-xs font-black text-primary bg-primary/15 px-3 py-1 rounded-xl shrink-0 flex items-center gap-1">
                        <Users size={14} /> {res.guestsCount} pessoas
                      </span>
                    </div>

                    {/* Linha 3: Contatos e Detalhes */}
                    <div className="space-y-2 text-xs text-foreground/90 pt-2.5 border-t border-border">
                      {res.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-primary" />
                          <a href={`tel:${res.customerPhone}`} className="hover:text-primary font-bold text-foreground">
                            {res.customerPhone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary" />
                        <span>Ambiente: <strong className="capitalize text-foreground font-bold">{res.areaPreference || "Qualquer"}</strong></span>
                        {res.tableNumber && (
                          <span className="text-primary font-black ml-auto bg-primary/15 px-2.5 py-0.5 rounded-lg border border-primary/30">
                            Mesa {res.tableNumber}
                          </span>
                        )}
                      </div>

                      {res.notes && (
                        <p className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl mt-1">
                          Nota: “{res.notes}”
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                        <span>{t.reservations.origin}: <strong className="uppercase text-foreground">{res.source}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                    {!isSeated && !isCanceled && (
                      <button
                        onClick={() => setCheckInReservation(res)}
                        className="flex-1 py-2.5 rounded-xl bg-success text-white text-xs font-black shadow-sm hover:bg-success/90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <UtensilsCrossed size={14} /> {t.reservations.clientArrivedBtn}
                      </button>
                    )}

                    {res.status === "pendente" && (
                      <button
                        onClick={() => handleUpdateStatus(res.id, "confirmada")}
                        className="py-2 px-3 rounded-xl bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-all"
                        title={t.reservations.confirmBtn}
                      >
                        {t.reservations.confirmBtn}
                      </button>
                    )}

                    {!isCanceled && (
                      <button
                        onClick={() => handleUpdateStatus(res.id, "cancelada")}
                        className="p-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
                        title={t.reservations.cancelBtn}
                      >
                        <XCircle size={15} />
                      </button>
                    )}

                    {isSeated && (
                      <span className="text-xs font-black text-success flex items-center gap-1">
                        <Check size={14} /> {t.reservations.tableOpenedInRoom}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Compartilhar & Google Reservar */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/20 text-primary">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">{t.reservations.linkModalTitle}</h3>
                    <p className="text-xs text-muted-foreground">{t.reservations.linkModalDesc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full bg-black/5 dark:bg-white/5"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="my-4 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    {t.reservations.directLinkLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicReservationUrl}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? t.common.copied : t.common.copy}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2 text-foreground">
                  <h4 className="font-black text-primary text-sm flex items-center gap-1.5">
                    📍 {t.reservations.howGoogleWorksTitle}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t.reservations.howGoogleWorksDesc}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground font-semibold">
                    <li>{t.reservations.googleStep1}</li>
                    <li>{t.reservations.googleStep2}</li>
                    <li>{t.reservations.googleStep3}</li>
                  </ol>
                  <p className="text-xs text-primary font-bold">
                    {t.reservations.googleTip}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-5 py-2 rounded-xl bg-foreground text-background text-xs font-black"
                >
                  {t.common.understood}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configuração de Horários */}
        <ScheduleConfigModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          tenantId={tenantId}
          initialSchedule={schedule}
          onSaved={(newSch) => setSchedule(newSch)}
        />

        {/* Modal: Nova Reserva */}
        <NewReservationModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          tenantId={tenantId}
          schedule={schedule}
          tables={tables}
          onCreated={() => {}}
        />

        {/* Modal: Check-in / Sentar */}
        {checkInReservation && (
          <CheckInModal
            isOpen={!!checkInReservation}
            onClose={() => setCheckInReservation(null)}
            tenantId={tenantId}
            reservation={checkInReservation}
            tables={tables}
            onSuccess={() => setCheckInReservation(null)}
          />
        )}
      </main>
    </div>
  );
}
