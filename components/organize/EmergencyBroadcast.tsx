'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { functions } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';

const BROADCAST_TYPES = [
  { id: 'evacuation', label: '🚨 Evacuation', color: 'red', desc: 'Immediate venue evacuation' },
  { id: 'medical', label: '🚑 Medical Emergency', color: 'orange', desc: 'Medical emergency on site' },
  { id: 'postponed', label: '📅 Postponed', color: 'blue', desc: 'Event rescheduled to new date' },
  { id: 'cancelled', label: '❌ Cancelled', color: 'red', desc: 'Event cancelled, refunds issued' },
  { id: 'allclear', label: '✅ All Clear', color: 'green', desc: 'Resume normal activity' },
  { id: 'custom', label: '📢 Custom Message', color: 'gray', desc: 'Send your own message' },
];

type Props = {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
};

export default function EmergencyBroadcast({ eventId, eventTitle, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [newDate, setNewDate] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSend = async () => {
    if (!selected) return;
    if (!functions) {
      alert('Firebase functions not initialized');
      return;
    }

    // Validation
    if (selected === 'custom' && !customMessage.trim()) {
      alert('Please enter a custom message');
      return;
    }
    if (selected === 'postponed' && !newDate.trim()) {
      alert('Please enter the new event date');
      return;
    }

    setSending(true);
    try {
      const sendBroadcast = httpsCallable(functions, 'sendEmergencyBroadcast');
      await sendBroadcast({
        eventId,
        broadcastType: selected,
        customMessage: selected === 'custom' ? customMessage : undefined,
        newDate: selected === 'postponed' ? newDate : undefined,
      });

      alert('✅ Emergency broadcast sent successfully');
      onClose();
    } catch (err) {
      console.error('Broadcast error:', err);
      alert('Failed to send broadcast. Please try again.');
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-2">📢 Emergency Broadcast</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Send an urgent alert to all {eventTitle} attendees via SMS
          </p>

          {!showConfirm ? (
            <>
              <div className="space-y-2 mb-6">
                {BROADCAST_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelected(type.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selected === type.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{type.desc}</div>
                  </button>
                ))}
              </div>

              {/* Conditional inputs */}
              {selected === 'custom' && (
                <textarea
                  placeholder="Enter your custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
              )}

              {selected === 'postponed' && (
                <input
                  type="text"
                  placeholder="New event date (e.g. Saturday, Dec 21 at 8PM)"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selected}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Alert
                </button>
              </div>
            </>
          ) : (
            // Confirmation dialog
            <div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <p className="font-semibold mb-2">⚠️ Confirm Emergency Broadcast</p>
                <p className="text-sm">
                  This will send an SMS to <strong>all active ticket holders</strong>. This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
