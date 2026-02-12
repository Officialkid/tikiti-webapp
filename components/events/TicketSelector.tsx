'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TikitiEvent, TicketType } from '@/types/event';
import { MinusIcon, PlusIcon, ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TicketSelectorProps {
  event: TikitiEvent;
  selectedTicket: TicketType | null;
  quantity: number;
  onSelectTicket: (ticket: TicketType) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

export default function TicketSelector({
  event,
  selectedTicket,
  quantity,
  onSelectTicket,
  onQuantityChange,
  onAddToCart,
}: TicketSelectorProps) {
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    onAddToCart();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getAvailable = (ticket: TicketType) => ticket.quantity - ticket.sold;
  const isAvailable = (ticket: TicketType) => getAvailable(ticket) > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Select Tickets
      </h2>

      {/* Ticket Types */}
      <div className="space-y-3 mb-6">
        {event.ticketTypes.map((ticket) => {
          const available = getAvailable(ticket);
          const isSelected = selectedTicket?.type === ticket.type;
          const canSelect = isAvailable(ticket);

          return (
            <button
              key={ticket.type}
              onClick={() => canSelect && onSelectTicket(ticket)}
              disabled={!canSelect}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : canSelect
                  ? 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                  : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {ticket.type}
                    </h3>
                    {isSelected && (
                      <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {ticket.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {available > 0 ? (
                        <span>
                          {available} remaining
                          {available <= 10 && (
                            <span className="text-orange-500 font-semibold ml-1">
                              (Limited!)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">Sold Out</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-black text-primary-600 dark:text-primary-400">
                    Ksh {ticket.price.toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quantity Selector */}
      {selectedTicket && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MinusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">
              {quantity}
            </span>
            <button
              onClick={() => {
                const maxAvailable = getAvailable(selectedTicket);
                onQuantityChange(Math.min(maxAvailable, quantity + 1));
              }}
              disabled={quantity >= getAvailable(selectedTicket)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Total Price */}
      {selectedTicket && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              {selectedTicket.type} × {quantity}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              Ksh {(selectedTicket.price * quantity).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
              Ksh {(selectedTicket.price * quantity).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedTicket || addedToCart}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          addedToCart
            ? 'bg-green-600 text-white'
            : selectedTicket
            ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {addedToCart ? (
          <>
            <CheckCircleIcon className="h-6 w-6" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCartIcon className="h-6 w-6" />
            Add to Cart
          </>
        )}
      </button>

      {!selectedTicket && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
          Select a ticket type to continue
        </p>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          Secure M-Pesa payment
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          80% refund up to 48hrs before
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          Instant QR ticket delivery
        </div>
      </div>
    </div>
  );
}
