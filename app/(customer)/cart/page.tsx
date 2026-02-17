'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrashIcon, MinusIcon, PlusIcon, LockClosedIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/layout/Navbar';
import { initiateFlutterwavePayment } from '@/lib/payments/flutterwave';
import dynamic from 'next/dynamic';
import Footer from '@/components/layout/Footer';

const PayPalButton = dynamic(() => import('@/components/payments/PayPalButton'), { ssr: false });
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PaymentMethod, SupportedCurrency } from '@/types/ticket';
import { ticketService } from '@/lib/services/ticketService';
import { formatCurrency, getPaymentMethodsForCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import { app, db } from '@/lib/firebase/config';

// All supported payment methods with metadata
const ALL_PAYMENT_METHODS = {
  mpesa: {
    id: 'mpesa' as PaymentMethod,
    label: 'M-Pesa',
    icon: '📱',
    description: 'Safaricom M-Pesa STK Push',
    flag: '🇰🇪',
    inputLabel: 'M-Pesa Number',
    placeholder: '0712345678',
  },
  airtel: {
    id: 'airtel' as PaymentMethod,
    label: 'Airtel Money',
    icon: '💳',
    description: 'Airtel Money prompt',
    flag: '🌍',
    inputLabel: 'Airtel Number',
    placeholder: '0733123456',
  },
  card: {
    id: 'card' as PaymentMethod,
    label: 'Debit / Credit Card',
    icon: '🏦',
    description: 'Visa or Mastercard',
    flag: '🌐',
    inputLabel: null,
    placeholder: null,
  },
  paypal: {
    id: 'paypal' as PaymentMethod,
    label: 'PayPal',
    icon: '🔵',
    description: 'Pay in USD, GBP or EUR',
    flag: '🌍',
    inputLabel: null,
    placeholder: null,
  },
};

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items, itemCount, totalAmount, tikitiFee, grandTotal,
    currency, removeFromCart, updateQuantity, clearCart,
  } = useCart();

  const availableMethods = getPaymentMethodsForCurrency(currency);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(
    availableMethods[0] as PaymentMethod
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<'waiting' | 'success' | 'failed' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showPayPalButton, setShowPayPalButton] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const needsPhone = selectedPayment === 'mpesa' || selectedPayment === 'airtel';

  // ── Poll payment status after STK Push ────────────────────────────
  const pollPaymentStatus = useCallback(
    (orderId: string) => {
      if (!db) return;
      let attempts = 0;
      const maxAttempts = 20; // 60 seconds max

      setPollStatus('waiting');
      setPendingOrderId(orderId);

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const snap = await getDoc(doc(db, 'orders', orderId));
          const status = snap.data()?.paymentStatus;

          if (status === 'completed') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setPollStatus('success');
            clearCart();
            setTimeout(() => router.push(`/order-confirmed?orderId=${orderId}`), 1500);
          } else if (status === 'failed' || attempts >= maxAttempts) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setPollStatus('failed');
            toast.error(
              status === 'failed'
                ? 'Payment was cancelled or failed. Try again.'
                : 'Payment timed out. Please try again.'
            );
          }
        } catch {
          // Silently retry on network errors
        }
      }, 3000);
    },
    [db, clearCart, router]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const cancelPending = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setPollStatus(null);
    setPendingOrderId(null);
    setIsProcessing(false);
  };

  // ── Handle Checkout ───────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to complete your purchase');
      router.push('/login');
      return;
    }
    if (needsPhone && !phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create the order in Firestore (tickets created with 'pending' status)
      const result = await ticketService.createOrder({
        userId: user.uid,
        items,
        subtotal: totalAmount,
        tikitiFee,
        grandTotal,
        currency,
        paymentMethod: selectedPayment,
        phoneNumber: needsPhone ? phoneNumber : undefined,
      });

      const { orderId } = result;

      // 2. Route to payment provider
      if (selectedPayment === 'mpesa') {
        // M-Pesa STK Push
        const firebaseFunctions = getFunctions(app!, 'us-central1');
        const initMpesa = httpsCallable(firebaseFunctions, 'initiateMpesaSTK');
        await initMpesa({ orderId, phoneNumber, amount: grandTotal });
        toast.info('📱 Check your phone for M-Pesa prompt', { duration: 10000 });

        // Poll for payment confirmation
        pollPaymentStatus(orderId);
      } else if (selectedPayment === 'card' || selectedPayment === 'airtel') {
        // Flutterwave
        const txRef = `TIKITI-${orderId}`;
        await updateDoc(doc(db, 'orders', orderId), {
          flutterwaveTxRef: txRef,
        });

        const methodMap: Record<string, string> = {
          airtel: 'mobile_money_kenya',
          card: 'card',
        };

        await initiateFlutterwavePayment({
          publicKey: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || '',
          orderId,
          amount: grandTotal,
          currency,
          email: user.email || '',
          phoneNumber: selectedPayment === 'airtel' ? phoneNumber : undefined,
          paymentMethod: methodMap[selectedPayment] as 'card' | 'mobile_money_kenya',
          onSuccess: () => {
            toast.success('Payment received!');
            clearCart();
            router.push(`/order-confirmed?orderId=${orderId}`);
          },
          onCancel: () => {
            toast.error('Payment cancelled');
            setIsProcessing(false);
          },
        });
      } else if (selectedPayment === 'paypal') {
        // PayPal — show PayPal button component
        setShowPayPalButton(true);
        setCurrentOrderId(orderId);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not initiate payment. Try again.');
      setIsProcessing(false);
    }
  };

  // Empty cart state
  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <p className="text-7xl mb-6">🛒</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-8">
            Find an event and grab your tickets!
          </p>
          <button
            onClick={() => router.push('/events')}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Browse Events
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-8">
          Your Cart ({itemCount} {itemCount === 1 ? 'ticket' : 'tickets'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart Items ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.cartItemId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  layout
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 flex gap-4"
                >
                  <img
                    src={item.eventImageUrl}
                    alt={item.eventTitle}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                          {item.eventTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                            {item.ticketType}
                          </span>
                          {item.isVirtual && (
                            <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                              📺 Virtual Stream
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(item.eventDate, 'EEE, MMM d • h:mm a')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.eventVenue}, {item.eventCity}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-semibold text-gray-900 dark:text-white text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.pricePerTicket, currency)} × {item.quantity}
                        </p>
                        <p className="font-black text-gray-900 dark:text-white">
                          {formatCurrency(item.pricePerTicket * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Order Summary Sidebar ──────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Tickets ({itemCount})</span>
                  <span data-testid="subtotal">{formatCurrency(totalAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Service Fee (5%)
                    <span className="ml-1 text-xs text-gray-400" title="Tikiti platform fee">ⓘ</span>
                  </span>
                  <span data-testid="tikiti-fee">{formatCurrency(tikitiFee, currency)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-black text-xl text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span data-testid="grand-total">{formatCurrency(grandTotal, currency)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </p>
                <div className="space-y-2">
                  {availableMethods.map((methodId) => {
                    const method = ALL_PAYMENT_METHODS[methodId as keyof typeof ALL_PAYMENT_METHODS];
                    if (!method) return null;
                    const isSelected = selectedPayment === method.id;
                    return (
                      <label
                        key={method.id}
                        data-testid={`payment-${method.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={isSelected}
                          onChange={() => setSelectedPayment(method.id)}
                          className="sr-only"
                        />
                        <span className="text-xl">{method.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {method.label} {method.flag}
                          </p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary-600 flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Phone input for M-Pesa / Airtel */}
              {needsPhone && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {ALL_PAYMENT_METHODS[selectedPayment]?.inputLabel}
                  </label>
                  <input
                    data-testid="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={ALL_PAYMENT_METHODS[selectedPayment]?.placeholder || ''}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    A payment prompt will be sent to this number
                  </p>
                </div>
              )}

              {/* PayPal Button (rendered after order is created) */}
              {showPayPalButton && currentOrderId && (
                <div className="mb-5">
                  <PayPalButton
                    orderId={currentOrderId}
                    amount={grandTotal}
                    currency={currency}
                    onSuccess={() => {
                      toast.success('Payment received!');
                      clearCart();
                      router.push(`/order-confirmed?orderId=${currentOrderId}`);
                    }}
                    onError={(msg) => {
                      toast.error(msg);
                      setShowPayPalButton(false);
                      setCurrentOrderId(null);
                    }}
                  />
                </div>
              )}

              {/* PayPal note */}
              {selectedPayment === 'paypal' && !showPayPalButton && (
                <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  Click Pay to create your order, then complete payment with PayPal.
                </div>
              )}

              {/* Checkout Button (hidden once PayPal buttons render) */}
              {!(selectedPayment === 'paypal' && showPayPalButton) && (
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  {isProcessing
                    ? 'Processing...'
                    : `Pay ${formatCurrency(grandTotal, currency)}`}
                </button>
              )}

              <p className="text-xs text-center text-gray-400 mt-3">
                🔒 Secure payment — tickets delivered instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Payment Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {pollStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {pollStatus === 'waiting' && (
                <>
                  <div className="relative mx-auto w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-4xl mb-3">
                    {selectedPayment === 'card' ? '💳' : '📱'}
                  </p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                    {selectedPayment === 'mpesa'
                      ? 'Check Your Phone'
                      : selectedPayment === 'airtel'
                        ? 'Check Your Phone'
                        : 'Confirming Payment'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {selectedPayment === 'mpesa'
                      ? 'Enter your M-Pesa PIN to complete the payment'
                      : selectedPayment === 'airtel'
                        ? 'Approve the Airtel Money prompt on your phone'
                        : 'Verifying your card payment…'}
                  </p>
                  <p className="text-xs text-gray-400 mb-6">
                    Waiting for confirmation…
                  </p>
                  <button
                    onClick={cancelPending}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {pollStatus === 'success' && (
                <>
                  <p className="text-5xl mb-4">✅</p>
                  <h3 className="text-xl font-black text-green-600 mb-2">
                    Payment Received!
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Redirecting to your tickets…
                  </p>
                </>
              )}

              {pollStatus === 'failed' && (
                <>
                  <p className="text-5xl mb-4">❌</p>
                  <h3 className="text-xl font-black text-red-600 mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    The payment was cancelled or timed out.
                  </p>
                  <button
                    onClick={cancelPending}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
