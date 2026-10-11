import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Reservation, 
  ReservationStatus, 
  OperatingSchedule, 
  DaySchedule,
  ShiftType 
} from "../domain/types";
import { tableService } from "./tableService";

export const DEFAULT_OPERATING_SCHEDULE: OperatingSchedule = {
  days: {
    0: { // Domingo
      isOpen: true,
      lunch: { open: "12:30", close: "16:00" },
      dinner: { open: "19:30", close: "23:00" }
    },
    1: { // Segunda (fechado por padrão)
      isOpen: false
    },
    2: { // Terça
      isOpen: true,
      lunch: { open: "12:00", close: "15:30" },
      dinner: { open: "19:30", close: "23:00" }
    },
    3: { // Quarta
      isOpen: true,
      lunch: { open: "12:00", close: "15:30" },
      dinner: { open: "19:30", close: "23:00" }
    },
    4: { // Quinta
      isOpen: true,
      lunch: { open: "12:00", close: "15:30" },
      dinner: { open: "19:30", close: "23:00" }
    },
    5: { // Sexta
      isOpen: true,
      lunch: { open: "12:00", close: "15:30" },
      dinner: { open: "19:30", close: "23:30" }
    },
    6: { // Sábado
      isOpen: true,
      lunch: { open: "12:30", close: "16:00" },
      dinner: { open: "19:30", close: "23:30" }
    }
  },
  slotDurationMinutes: 30,
  maxGuestsPerSlot: 20,
  minAdvanceNoticeHours: 1,
  notes: "Reservas com tolerância de 15 minutos."
};

export const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

export const reservationService = {
  /**
   * Obtém horários de funcionamento salvos ou retorna padrão
   */
  async getOperatingSchedule(tenantId: string): Promise<OperatingSchedule> {
    if (!tenantId) return DEFAULT_OPERATING_SCHEDULE;
    try {
      const snap = await getDoc(doc(db, "tenants", tenantId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.operatingSchedule) {
          return data.operatingSchedule as OperatingSchedule;
        }
      }
    } catch (e) {
      console.warn("Falha ao buscar horário do tenant:", e);
    }
    return DEFAULT_OPERATING_SCHEDULE;
  },

  /**
   * Salva configurações de dias e horários de funcionamento no tenant
   */
  async saveOperatingSchedule(tenantId: string, schedule: OperatingSchedule): Promise<void> {
    if (!tenantId) return;
    const ref = doc(db, "tenants", tenantId);
    await updateDoc(ref, { operatingSchedule: schedule });
  },

  /**
   * Verifica se determinada data (YYYY-MM-DD) é um dia de funcionamento aberto
   */
  isDateOpen(dateStr: string, schedule: OperatingSchedule): boolean {
    if (!dateStr) return false;
    // Cria data segura para evitar problemas de fuso
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return false;
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const dayOfWeek = date.getDay();
    const dayConfig = schedule.days[dayOfWeek];
    return !!dayConfig?.isOpen;
  },

  /**
   * Retorna os slots de horários disponíveis para determinada data segundo a grade
   */
  getAvailableSlots(dateStr: string, schedule: OperatingSchedule): { time: string; shift: ShiftType }[] {
    if (!this.isDateOpen(dateStr, schedule)) return [];

    const parts = dateStr.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const dayOfWeek = date.getDay();
    const dayConfig = schedule.days[dayOfWeek];
    if (!dayConfig || !dayConfig.isOpen) return [];

    const slots: { time: string; shift: ShiftType }[] = [];
    const step = schedule.slotDurationMinutes || 30;

    const generateTimeSlots = (startStr: string, endStr: string, shift: ShiftType) => {
      const [startH, startM] = startStr.split(":").map(Number);
      const [endH, endM] = endStr.split(":").map(Number);
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
        const m = (currentMinutes % 60).toString().padStart(2, "0");
        slots.push({ time: `${h}:${m}`, shift });
        currentMinutes += step;
      }
    };

    if (dayConfig.lunch?.open && dayConfig.lunch?.close) {
      generateTimeSlots(dayConfig.lunch.open, dayConfig.lunch.close, "almoco");
    }

    if (dayConfig.dinner?.open && dayConfig.dinner?.close) {
      generateTimeSlots(dayConfig.dinner.open, dayConfig.dinner.close, "jantar");
    }

    return slots;
  },

  /**
   * Assinatura em tempo real de reservas do tenant
   */
  subscribeReservations(
    tenantId: string, 
    dateFilter: string | null, 
    onUpdate: (reservations: Reservation[]) => void
  ) {
    if (!tenantId) return () => {};

    let q = query(collection(db, "reservations"), where("tenant_id", "==", tenantId));
    if (dateFilter) {
      q = query(
        collection(db, "reservations"),
        where("tenant_id", "==", tenantId),
        where("date", "==", dateFilter)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Reservation));

      // Ordena por horário crescente
      list.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      onUpdate(list);
    });
  },

  /**
   * Criação de reserva (painel ou formulário público)
   */
  async createReservation(
    data: Omit<Reservation, "id" | "createdAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "reservations"), {
      ...data,
      status: data.status || "confirmada",
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  /**
   * Atualização de status da reserva
   */
  async updateReservationStatus(
    reservationId: string, 
    status: ReservationStatus, 
    tableId?: string,
    tableNumber?: number
  ): Promise<void> {
    const updateData: any = { status };
    if (tableId !== undefined) updateData.tableId = tableId;
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber;
    await updateDoc(doc(db, "reservations", reservationId), updateData);
  },

  /**
   * Check-in de reserva: Aloca a mesa, marca reserva como 'sentada' e abre a comanda da mesa
   */
  async checkInReservation(
    tenantId: string,
    reservation: Reservation,
    tableId: string,
    tableNumber: number
  ): Promise<void> {
    // 1. Atualiza a reserva
    await this.updateReservationStatus(reservation.id, "sentada", tableId, tableNumber);

    // 2. Abre a mesa no salão com os dados do cliente
    await tableService.openTable(
      tableId, 
      `${reservation.customerName} (${reservation.guestsCount}p)`, 
      reservation.customerPhone || ""
    );
  },

  /**
   * Cancela reserva
   */
  async cancelReservation(reservationId: string): Promise<void> {
    await updateDoc(doc(db, "reservations", reservationId), { status: "cancelada" });
  },

  /**
   * Exclui reserva do sistema
   */
  async deleteReservation(reservationId: string): Promise<void> {
    await deleteDoc(doc(db, "reservations", reservationId));
  }
};
