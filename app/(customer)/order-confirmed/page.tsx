'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { TicketIcon } from '@heroicons/react/24/outline';

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId');
  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    if (seconds <= 0) { router.push('/my-tickets'); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.7, bounce: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25" />
              <CheckCircleIcon className="h-24 w-24 text-green-500 relative z-10" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Tickets Confirmed! 🎉
            </h1>
            <p className="text-gray-500 mb-1">Payment successful.</p>
            {orderId && (
              <p className="text-xs font-mono text-gray-400 mb-8">
                Order #{orderId.slice(0, 12).toUpperCase()}
              </p>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 mb-8 text-left">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">What&apos;s next?</h2>
              {[
                { icon: '🎟️', text: 'QR tickets are ready in My Tickets' },
                { icon: '📱', text: 'Show QR code at the venue entrance' },
                { icon: '📧', text: 'Check your email for your receipt' },
                { icon: '🔔', text: 'Set a reminder so you don\'t miss it' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/my-tickets"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <TicketIcon className="h-5 w-5" />
                View My Tickets
              </Link>
              <Link
                href="/events"
                className="py-2.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
              >
                Browse More Events
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-5">
              Redirecting to My Tickets in {seconds}s…
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderConfirmedPage() {
  return <Suspense fallback={null}><Content /></Suspense>;
}
