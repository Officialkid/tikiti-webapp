import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { eventId, broadcastType, customMessage, newDate } = await request.json();

    if (!eventId || !broadcastType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all ticket holders for this event (with phone numbers)
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('user_id, users(phone_number)')
      .eq('event_id', eventId);

    if (ticketsError || !tickets) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Build message based on broadcast type
    let message = '';
    switch (broadcastType) {
      case 'evacuation':
        message = `🚨 URGENT: ${event.title} - Immediate evacuation required. Follow staff instructions.`;
        break;
      case 'medical':
        message = `🚑 ALERT: ${event.title} - Medical emergency on site. Stay calm, follow staff guidance.`;
        break;
      case 'postponed':
        message = `📅 UPDATE: ${event.title} postponed to ${newDate}. Your tickets remain valid.`;
        break;
      case 'cancelled':
        message = `❌ CANCELLATION: ${event.title} has been cancelled. Refunds will be processed automatically.`;
        break;
      case 'allclear':
        message = `✅ ALL CLEAR: ${event.title} - Resume normal activity. Enjoy the event!`;
        break;
      case 'custom':
        message = `📢 ${event.title}: ${customMessage}`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid broadcast type' },
          { status: 400 }
        );
    }

    // Extract unique phone numbers
    const phoneNumbers = Array.from(
      new Set(
        tickets
          .map((t) => (t as { users?: { phone_number?: string } }).users?.phone_number)
          .filter((phone): phone is string => !!phone)
      )
    );

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found with phone numbers' },
        { status: 400 }
      );
    }

    // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.)
    // For now, we'll log the broadcast
    console.log('Emergency Broadcast:', {
      eventId,
      eventTitle: event.title,
      type: broadcastType,
      message,
      recipients: phoneNumbers.length,
    });

    // In production, you would send SMS here:
    // await sendSMS(phoneNumbers, message);

    // Log the broadcast in the database
    const { error: logError } = await supabase
      .from('emergency_broadcasts')
      .insert({
        event_id: eventId,
        broadcast_type: broadcastType,
        message,
        recipient_count: phoneNumbers.length,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log broadcast:', logError);
    }

    return NextResponse.json({
      success: true,
      recipientCount: phoneNumbers.length,
      message,
    });
  } catch (error) {
    console.error('Emergency broadcast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
