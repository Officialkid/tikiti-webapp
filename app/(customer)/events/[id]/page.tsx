import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailsClient from '@/components/events/EventDetailsClient';
import { eventService } from '@/lib/services/eventService';

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EventDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const event = await eventService.getEventById(id);

    if (!event) {
      return {
        title: 'Event Not Found | Tikiti',
        description: 'The event you are looking for could not be found.',
      };
    }

    const cheapestTicket = event.ticketTypes.reduce((min, ticket) =>
      ticket.price < min.price ? ticket : min
    );

    return {
      title: `${event.title} | Tikiti`,
      description: event.description.substring(0, 160),
      openGraph: {
        title: event.title,
        description: event.description.substring(0, 160),
        images: event.imageUrl
          ? [
              {
                url: event.imageUrl,
                width: 1200,
                height: 630,
                alt: event.title,
              },
            ]
          : [],
        type: 'website',
        locale: 'en_KE',
        siteName: 'Tikiti',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: event.description.substring(0, 160),
        images: event.imageUrl ? [event.imageUrl] : [],
      },
      keywords: [
        event.title,
        event.category,
        event.location.city || '',
        'event tickets',
        'Kenya events',
        ...event.tags,
      ].filter(Boolean),
      other: {
        'event:start_date': event.dateTime.toISOString(),
        'event:location': event.location.venue,
        'event:price': `Ksh ${cheapestTicket.price}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event Details | Tikiti',
      description: 'Find and book tickets to amazing events across Kenya.',
    };
  }
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;

  try {
    const event = await eventService.getEventById(id);

    if (!event) {
      notFound();
    }

    return <EventDetailsClient event={event} />;
  } catch (error) {
    console.error('Error fetching event:', error);
    notFound();
  }
}
