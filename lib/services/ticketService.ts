import {
  collection, doc, setDoc, getDocs,
  query, where, orderBy, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CartItem, Ticket, SupportedCurrency, PaymentMethod } from '@/types/ticket';
import { v4 as uuidv4 } from 'uuid';

const TIKITI_FEE_PERCENT = 0.05;

interface CreateOrderParams {
  userId: string;
  items: CartItem[];
  subtotal: number;
  tikitiFee: number;
  grandTotal: number;
  currency: SupportedCurrency;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
}

export const ticketService = {

  // ── CREATE ORDER + TICKETS ─────────────────────────────────────────
  async createOrder(params: CreateOrderParams): Promise<{ orderId: string }> {
    const { userId, items, subtotal, tikitiFee, grandTotal, currency, paymentMethod, phoneNumber } = params;
    const orderId = uuidv4();
    const ticketIds: string[] = [];

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = uuidv4();
        const perTicketFee = Math.round(item.pricePerTicket * TIKITI_FEE_PERCENT);
        const organizerPayout = item.pricePerTicket - perTicketFee;

        // Stream token — only for virtual tickets
        const streamToken = item.isVirtual ? uuidv4() : undefined;

        // QR payload — checksum prevents tampering
        const qrCodeData = JSON.stringify({
          ticketId,
          eventId: item.eventId,
          userId,
          ticketType: item.ticketType,
          isVirtual: item.isVirtual,
          orderId,
          checksum: btoa(`${ticketId}:${item.eventId}:${userId}`),
        });

        const ticketDoc = {
          ticketId,
          userId,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          eventImageUrl: item.eventImageUrl,
          eventDate: Timestamp.fromDate(item.eventDate),
          eventVenue: item.eventVenue,
          eventCity: item.eventCity,
          organizerId: item.organizerId,
          ticketType: item.ticketType,
          price: item.pricePerTicket,         // What buyer paid
          tikitiFee: perTicketFee,            // 5% — for Tikiti accounting
          organizerPayout,                    // price - fee — what organizer gets
          currency,
          qrCodeData,
          paymentMethod,
          paymentStatus: 'active',
          isVirtual: item.isVirtual,
          streamToken: streamToken || null,
          checkedIn: false,
          checkedInAt: null,
          purchasedAt: Timestamp.now(),
        };

        await setDoc(doc(db!, 'tickets', ticketId), ticketDoc);
        ticketIds.push(ticketId);
      }
    }

    // Save order summary
    await setDoc(doc(db!, 'orders', orderId), {
      orderId,
      userId,
      items,                                  // Keep items for order confirmation display
      ticketCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      tikitiFee,
      grandTotal,
      currency,
      paymentMethod,
      phoneNumber: phoneNumber || null,
      paymentStatus: 'completed',
      // Sprint 4 will change this to 'pending' until payment webhook fires
      ticketIds,
      createdAt: Timestamp.now(),
    });

    return { orderId };
  },

  // ── GET USER'S TICKETS ─────────────────────────────────────────────
  async getUserTickets(userId: string): Promise<Ticket[]> {
    try {
      const q = query(
        collection(db!, 'tickets'),
        where('userId', '==', userId),
        orderBy('purchasedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          eventDate: data.eventDate.toDate(),
          purchasedAt: data.purchasedAt.toDate(),
          checkedInAt: data.checkedInAt?.toDate() || undefined,
        } as Ticket;
      });
    } catch (err) {
      console.error('getUserTickets error:', err);
      throw err;
    }
  },

  // ── GET TICKETS FOR AN EVENT (organizer view) ──────────────────────
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const q = query(
        collection(db!, 'tickets'),
        where('eventId', '==', eventId),
        orderBy('purchasedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          eventDate: data.eventDate.toDate(),
          purchasedAt: data.purchasedAt.toDate(),
          checkedInAt: data.checkedInAt?.toDate() || undefined,
        } as Ticket;
      });
    } catch (err) {
      console.error('getEventTickets error:', err);
      throw err;
    }
  },

  // ── CHECK IN TICKET (QR scanner result) ───────────────────────────
  async checkInTicket(ticketId: string, eventId: string): Promise<{
    success: boolean;
    message: string;
    ticket?: Partial<Ticket>;
  }> {
    try {
      const q = query(
        collection(db!, 'tickets'),
        where('ticketId', '==', ticketId),
        where('eventId', '==', eventId)
      );
      const snap = await getDocs(q);

      if (snap.empty) return { success: false, message: '❌ Ticket not found' };

      const ticketDoc = snap.docs[0];
      const data = ticketDoc.data();

      if (data.checkedIn) {
        const time = data.checkedInAt?.toDate()?.toLocaleTimeString() || 'earlier';
        return { success: false, message: `⚠️ Already checked in at ${time}` };
      }

      if (data.isVirtual) {
        return { success: false, message: '❌ Virtual ticket — not valid for entry' };
      }

      if (data.paymentStatus !== 'active') {
        return { success: false, message: `❌ Ticket is ${data.paymentStatus}` };
      }

      // Mark checked in
      await updateDoc(ticketDoc.ref, {
        checkedIn: true,
        checkedInAt: Timestamp.now(),
      });

      // Increment venue capacity
      const { eventService } = await import('./eventService');
      await eventService.incrementCapacity(eventId);

      return {
        success: true,
        message: `✅ Valid — ${data.ticketType}`,
        ticket: { ticketType: data.ticketType, isVirtual: false },
      };
    } catch (err) {
      console.error('checkInTicket error:', err);
      return { success: false, message: '❌ Check-in failed. Try again.' };
    }
  },

  // ── VALIDATE QR DATA FORMAT ────────────────────────────────────────
  validateQRData(raw: string): {
    valid: boolean;
    data?: { ticketId: string; eventId: string; userId: string };
  } {
    try {
      const parsed = JSON.parse(raw);
      const { ticketId, eventId, userId, checksum } = parsed;
      if (!ticketId || !eventId || !userId || !checksum) return { valid: false };
      // Validate checksum
      const expected = btoa(`${ticketId}:${eventId}:${userId}`);
      if (checksum !== expected) return { valid: false };
      return { valid: true, data: { ticketId, eventId, userId } };
    } catch {
      return { valid: false };
    }
  },

  // ── GET ORDER BY ID ────────────────────────────────────────────────
  async getOrder(orderId: string): Promise<Record<string, unknown> | null> {
    try {
      const q = query(
        collection(db!, 'orders'),
        where('orderId', '==', orderId)
      );
      const snap = await getDocs(q);

      if (snap.empty) return null;

      const data = snap.docs[0].data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      };
    } catch (err) {
      console.error('getOrder error:', err);
      return null;
    }
  },
};
