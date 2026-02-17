'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Ticket } from '@/types/ticket';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';

interface Props { ticket: Ticket; }

export default function TicketCard({ ticket }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isPast = ticket.eventDate < new Date();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      saveAs(dataUrl, `tikiti-${ticket.ticketId.slice(0, 8)}.png`);
      toast.success('Ticket downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="relative">
      {/* Downloadable Card */}
      <div
        ref={cardRef}
        className={`bg-white rounded-2xl overflow-hidden shadow-lg ${isPast ? 'opacity-60 grayscale' : ''}`}
      >
        {/* Event Banner */}
        <div className="relative h-28">
          <Image src={ticket.eventImageUrl} alt={ticket.eventTitle} fill className="object-cover" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Status */}
          <div className="absolute top-3 right-3">
            {ticket.checkedIn ? (
              <span className="bg-gray-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">✓ Used</span>
            ) : isPast ? (
              <span className="bg-gray-400 text-white text-xs font-bold px-2.5 py-1 rounded-full">Expired</span>
            ) : (
              <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">● Active</span>
            )}
          </div>

          <h3 className="absolute bottom-3 left-4 text-white font-black text-lg leading-tight line-clamp-1 pr-4">
            {ticket.eventTitle}
          </h3>
        </div>

        {/* Tear line */}
        <div className="relative flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 flex-shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
          <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 flex-shrink-0" />
        </div>

        {/* Details + QR */}
        <div className="p-4 flex gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Ticket</p>
              <p className="font-bold text-gray-900 text-sm">
                {ticket.ticketType}
                {ticket.isVirtual && (
                  <span className="ml-1.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                    Virtual
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
              <p className="font-semibold text-gray-900 text-sm">
                {format(ticket.eventDate, 'EEE, MMM d yyyy')}
              </p>
              <p className="text-xs text-gray-500">{format(ticket.eventDate, 'h:mm a')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Venue</p>
              <p className="font-semibold text-gray-900 text-sm line-clamp-1">{ticket.eventVenue}</p>
              <p className="text-xs text-gray-500">{ticket.eventCity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Paid</p>
              <p className="font-bold text-primary-600 text-sm">
                {formatCurrency(ticket.price, ticket.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-mono">
                #{ticket.ticketId.slice(0, 12).toUpperCase()}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-start flex-shrink-0">
            <div className="p-2 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
              <QRCodeSVG
                value={ticket.qrCodeData}
                size={96}
                level="H"
                includeMargin={false}
                fgColor="#1e40af"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">Scan at entry</p>
          </div>
        </div>

        {/* Tikiti Footer */}
        <div className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 flex items-center justify-between">
          <span className="text-white font-black text-sm">TIKITI</span>
          <span className="text-white/70 text-xs">Safe. Social. Hybrid.</span>
        </div>
      </div>

      {/* Download button (outside card so it doesn't appear in PNG) */}
      {!isPast && (
        <button
          onClick={handleDownload}
          className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm"
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          Save
        </button>
      )}
    </div>
  );
}
