"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  UtensilsCrossed,
  MapPin,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  OperatingSchedule, 
  ShiftType, 
  TenantProfile 
} from "../../domain/types";
import { 
  reservationService, 
  DEFAULT_OPERATING_SCHEDULE
} from "../../services/reservationService";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { LanguageSelector } from "../../components/common/LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";

function ReservarContent() {
  const searchParams = useSearchParams();
  const { t, getDayName } = useLanguage();
  const [tenantId, setTenantId] = useState<string>("demo-tenant");

  const [restaurantName, setRestaurantName] = useState("Restaurante & Bar");
  const [schedule, setSchedule] = useState<OperatingSchedule>(DEFAULT_OPERATING_SCHEDULE);
  const [loadingTenant, setLoadingTenant] = useState(true);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("");
  const [shift, setShift] = useState<ShiftType>("almoco");
  const [guestsCount, setGuestsCount] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [areaPreference, setAreaPreference] = useState<"salao" | "esplanada" | "balcao" | "qualquer">("qualquer");
  const [notes, setNotes] = useState("");

  const [availableSlots, setAvailableSlots] = useState<{ time: string; shift: ShiftType }[]>([]);
  const [isOpenDay, setIsOpenDay] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  // Detecta tenant por query param (?tenant=XYZ)
  useEffect(() => {
    const qTenant = searchParams.get("tenant");
    if (qTenant) {
      setTenantId(qTenant);
    }
  }, [searchParams]);

  // Carrega informações e horários do restaurante
  useEffect(() => {
    if (!tenantId) return;

    const loadData = async () => {
      setLoadingTenant(true);
      try {
        const snap = await getDoc(doc(db, "tenants", tenantId));
        if (snap.exists()) {
          const d = snap.data() as TenantProfile;
          if (d.businessName) setRestaurantName(d.businessName);
          if (d.operatingSchedule) {
            setSchedule(d.operatingSchedule);
          }
        }
      } catch (e) {
        console.warn("Tenant load fallback:", e);
      } finally {
        setLoadingTenant(false);
      }
    };

    loadData();
  }, [tenantId]);

  // Atualiza slots de horários com base na data escolhida
  useEffect(() => {
    if (!date) return;
    const open = reservationService.isDateOpen(date, schedule);
    setIsOpenDay(open);

    if (open) {
      const slots = reservationService.getAvailableSlots(date, schedule);
      setAvailableSlots(slots);
      if (slots.length > 0) {
        setTime(slots[0].time);
        setShift(slots[0].shift);
      } else {
        setTime("");
      }
    } else {
      setAvailableSlots([]);
      setTime("");
    }
  }, [date, schedule]);

  // Extrai nome do dia traduzido dinamicamente
  const dateParts = date.split("-").map(Number);
  const selectedDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
  const dayName = getDayName(selectedDateObj.getDay());

  // Detecta se veio do Google
  const isFromGoogle = searchParams.get("source") === "google" || 
    (typeof document !== "undefined" && document.referrer.includes("google"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !date || !time) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!isOpenDay) {
      alert(t.publicBooking.closedAlertDesc);
      return;
    }

    setSubmitting(true);
    try {
      const resId = await reservationService.createReservation({
        tenant_id: tenantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        date,
        time,
        shift,
        guestsCount: Number(guestsCount) || 2,
        areaPreference,
        notes: notes.trim() || undefined,
        status: "confirmada",
        source: isFromGoogle ? "google" : "publico"
      });

      setBookingConfirmed({
        id: resId,
        customerName,
        date,
        time,
        guestsCount,
        restaurantName
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Topo / Branding & Seletor de Idioma */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-20 backdrop-blur-md bg-card/95">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <h1 className="text-base font-black leading-tight text-foreground">{restaurantName}</h1>
              <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-primary" /> {t.publicBooking.pageTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col justify-center">
        {bookingConfirmed ? (
          /* Tela de Confirmação Sucesso */
          <div className="bg-card border border-success/40 rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-black text-foreground">{t.publicBooking.confirmedTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {t.publicBooking.confirmedSubtitle} <strong>{restaurantName}</strong>.
            </p>

            <div className="bg-black/5 dark:bg-white/5 border border-border rounded-2xl p-4 text-sm space-y-2.5 text-left mb-6">
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">{t.publicBooking.holderLabel}</span>
                <span className="font-bold text-foreground">{bookingConfirmed.customerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">{t.publicBooking.dateLabel}</span>
                <span className="font-bold text-foreground">{bookingConfirmed.date} ({dayName})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">{t.publicBooking.timeLabel}</span>
                <span className="font-bold text-primary text-base">{bookingConfirmed.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.publicBooking.guestsLabel}</span>
                <span className="font-bold text-foreground">{bookingConfirmed.guestsCount} {t.common.people}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-5">
              {t.publicBooking.arrivalNotice}
            </p>

            <button
              onClick={() => setBookingConfirmed(null)}
              className="w-full py-3.5 bg-primary text-white font-black rounded-2xl text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
            >
              {t.publicBooking.bookAnotherBtn}
            </button>
          </div>
        ) : (
          /* Formulário de Reserva */
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black text-foreground">{t.publicBooking.bookYourTableTitle}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.publicBooking.bookYourTableSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Data da Reserva */}
              <div>
                <label className="text-sm font-black text-foreground flex items-center gap-1.5 mb-2">
                  <Calendar size={16} className="text-primary" /> {t.publicBooking.selectDateLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                  />
                  <span className="text-sm font-black text-foreground bg-black/5 dark:bg-white/10 px-4 py-3 rounded-xl whitespace-nowrap border border-border">
                    {dayName}
                  </span>
                </div>

                {!isOpenDay && (
                  <div className="mt-2.5 p-3.5 rounded-2xl bg-destructive/15 border border-destructive/40 text-destructive text-sm flex items-center gap-2.5 animate-in fade-in">
                    <AlertTriangle size={18} className="shrink-0" />
                    <div>
                      <span className="font-black">{t.publicBooking.closedAlertTitle}</span>
                      <p className="text-xs opacity-95">{t.publicBooking.closedAlertDesc}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Horários Disponíveis */}
              {isOpenDay && (
                <div>
                  <label className="text-sm font-black text-foreground flex items-center gap-1.5 mb-2">
                    <Clock size={16} className="text-primary" /> {t.publicBooking.selectTimeLabel}
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-border">
                      {t.reservations.noTimesConfigured}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 border border-border rounded-2xl bg-black/5 dark:bg-white/5">
                      {availableSlots.map(slot => (
                        <button
                          type="button"
                          key={slot.time}
                          onClick={() => { setTime(slot.time); setShift(slot.shift); }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-black text-center transition-all ${
                            time === slot.time 
                              ? "bg-primary text-white shadow-md shadow-primary/25 scale-102" 
                              : "bg-card text-foreground border border-border hover:border-primary"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Número de Convidados e Setor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-black text-foreground flex items-center gap-1.5 mb-2">
                    <Users size={16} className="text-primary" /> {t.publicBooking.selectGuestsLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestsCount}
                    onChange={e => setGuestsCount(Number(e.target.value))}
                    required
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-foreground block mb-2">
                    {t.publicBooking.environmentLabel}
                  </label>
                  <select
                    value={areaPreference}
                    onChange={e => setAreaPreference(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                  >
                    <option value="qualquer">{t.common.anySector}</option>
                    <option value="salao">{t.common.mainRoom}</option>
                    <option value="esplanada">{t.common.terrace}</option>
                    <option value="balcao">{t.common.counter}</option>
                  </select>
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="space-y-3 pt-3.5 border-t border-border">
                <span className="text-xs font-black uppercase text-muted-foreground tracking-wider">{t.publicBooking.contactInfoLabel}</span>
                
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-primary" size={16} />
                  <input
                    type="text"
                    placeholder={t.publicBooking.fullNamePlaceholder}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 text-primary" size={16} />
                    <input
                      type="tel"
                      placeholder={t.publicBooking.phonePlaceholder}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      required
                      className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-primary" size={16} />
                    <input
                      type="email"
                      placeholder={t.publicBooking.emailPlaceholder}
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-primary" size={16} />
                  <input
                    type="text"
                    placeholder={t.publicBooking.notesPlaceholder}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-foreground focus:border-primary focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting || !isOpenDay || !time}
                  className="w-full py-3.5 bg-primary text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-98 disabled:opacity-50"
                >
                  {submitting ? t.publicBooking.submittingBtn : t.publicBooking.submitBtn}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        {t.common.poweredBy} <strong>MeuGerente Restaurant OS</strong>
      </footer>
    </div>
  );
}

export default function ReservarPublicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}>
      <ReservarContent />
    </Suspense>
  );
}
