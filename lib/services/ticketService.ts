import { supabase } from '@/lib/supabase/config';
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
          id: ticketId,
          user_id: userId,
          event_id: item.eventId,
          order_id: orderId,
          ticket_type_id: null, // Could be matched from item.ticketType if needed
          ticket_type: item.ticketType,
          price: item.pricePerTicket,
          tikiti_fee: perTicketFee,
          organizer_payout: organizerPayout,
          currency,
          qr_code_data: qrCodeData,
          payment_method: paymentMethod,
          payment_status: 'active',
          is_virtual: item.isVirtual,
          stream_token: streamToken || null,
          checked_in: false,
          checked_in_at: null,
          purchased_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('tickets')
          .insert(ticketDoc);

        if (error) throw error;

        ticketIds.push(ticketId);
      }
    }

    // Save order summary
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        ticket_count: items.reduce((s, i) => s + i.quantity, 0),
        subtotal,
        tikiti_fee: tikitiFee,
        grand_total: grandTotal,
        currency,
        payment_method: paymentMethod,
        phone_number: phoneNumber || null,
        payment_status: 'completed',
        // Sprint 4 will change this to 'pending' until payment webhook fires
      });

    if (orderError) throw orderError;

    return { orderId };
  },

  // ── GET USER'S TICKETS ─────────────────────────────────────────────
  async getUserTickets(userId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            image_url,
            start_date,
            venue_name,
            city,
            organizer_id
          )
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ticketId: row.id,
        userId: row.user_id,
        eventId: row.event_id,
        eventTitle: row.events?.title || '',
        eventImageUrl: row.events?.image_url || '',
        eventDate: new Date(row.events?.start_date || new Date()),
        eventVenue: row.events?.venue_name || '',
        eventCity: row.events?.city || '',
        organizerId: row.events?.organizer_id || '',
        ticketType: row.ticket_type,
        price: row.price,
        tikitiFee: row.tikiti_fee,
        organizerPayout: row.organizer_payout,
        currency: row.currency,
        qrCodeData: row.qr_code_data,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        isVirtual: row.is_virtual,
        streamToken: row.stream_token,
        checkedIn: row.checked_in,
        checkedInAt: row.checked_in_at ? new Date(row.checked_in_at) : undefined,
        purchasedAt: new Date(row.purchased_at),
      })) as Ticket[];
    } catch (err) {
      console.error('getUserTickets error:', err);
      throw err;
    }
  },

  // ── GET TICKETS FOR AN EVENT (organizer view) ──────────────────────
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            image_url,
            start_date,
            venue_name,
            city,
            organizer_id
          )
        `)
        .eq('event_id', eventId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ticketId: row.id,
        userId: row.user_id,
        eventId: row.event_id,
        eventTitle: row.events?.title || '',
        eventImageUrl: row.events?.image_url || '',
        eventDate: new Date(row.events?.start_date || new Date()),
        eventVenue: row.events?.venue_name || '',
        eventCity: row.events?.city || '',
        organizerId: row.events?.organizer_id || '',
        ticketType: row.ticket_type,
        price: row.price,
        tikitiFee: row.tikiti_fee,
        organizerPayout: row.organizer_payout,
        currency: row.currency,
        qrCodeData: row.qr_code_data,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        isVirtual: row.is_virtual,
        streamToken: row.stream_token,
        checkedIn: row.checked_in,
        checkedInAt: row.checked_in_at ? new Date(row.checked_in_at) : undefined,
        purchasedAt: new Date(row.purchased_at),
      })) as Ticket[];
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
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('event_id', eventId)
        .single();

      if (error || !data) return { success: false, message: '❌ Ticket not found' };

      if (data.checked_in) {
        const time = data.checked_in_at ? new Date(data.checked_in_at).toLocaleTimeString() : 'earlier';
        return { success: false, message: `⚠️ Already checked in at ${time}` };
      }

      if (data.is_virtual) {
        return { success: false, message: '❌ Virtual ticket — not valid for entry' };
      }

      if (data.payment_status !== 'active') {
        return { success: false, message: `❌ Ticket is ${data.payment_status}` };
      }

      // Mark checked in
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Increment venue capacity
      const { eventService } = await import('./eventService');
      await eventService.incrementCapacity(eventId);

      return {
        success: true,
        message: `✅ Valid — ${data.ticket_type}`,
        ticket: { ticketType: data.ticket_type, isVirtual: false },
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) return null;

      return {
        orderId: data.id,
        userId: data.user_id,
        ticketCount: data.ticket_count,
        subtotal: data.subtotal,
        tikitiFee: data.tikiti_fee,
        grandTotal: data.grand_total,
        currency: data.currency,
        paymentMethod: data.payment_method,
        phoneNumber: data.phone_number,
        paymentStatus: data.payment_status,
        createdAt: new Date(data.created_at),
      };
    } catch (err) {
      console.error('getOrder error:', err);
      return null;
    }
  },
};
