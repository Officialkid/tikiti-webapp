'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import { ticketService } from '@/lib/services/ticketService';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface QRScannerProps {
  eventId: string;
  eventTitle: string;
}

type ResultType = 'success' | 'warning' | 'error';

interface ScanResult {
  type: ResultType;
  message: string;
  ticketType?: string;
}

const COOLDOWN_MS = 3000;

export default function QRScanner({ eventId, eventTitle }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // ── Start camera ──────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      const error = err as Error & { name: string };
      if (error.name === 'NotAllowedError') {
        setCameraError(
          'Camera permission denied. Please allow camera access in your browser settings and refresh the page.'
        );
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // ── Handle QR result ──────────────────────────────────────────────
  const handleQRResult = useCallback(
    async (raw: string) => {
      if (processing || cooldown) return;
      setProcessing(true);
      setCooldown(true);

      // Vibrate on detection
      if (navigator.vibrate) navigator.vibrate(200);

      // 1. Client-side validation (no DB hit)
      const validation = ticketService.validateQRData(raw);

      if (!validation.valid || !validation.data) {
        setScanResult({ type: 'error', message: '❌ Invalid QR code' });
        setProcessing(false);
        setTimeout(() => setCooldown(false), COOLDOWN_MS);
        return;
      }

      // 2. Verify the ticket belongs to this event
      if (validation.data.eventId !== eventId) {
        setScanResult({
          type: 'warning',
          message: '⚠️ Ticket is for a different event',
        });
        setProcessing(false);
        setTimeout(() => setCooldown(false), COOLDOWN_MS);
        return;
      }

      // 3. Firestore check-in (only for valid format)
      const result = await ticketService.checkInTicket(
        validation.data.ticketId,
        eventId
      );

      if (result.success) {
        setScanResult({
          type: 'success',
          message: result.message,
          ticketType: result.ticket?.ticketType,
        });
        setCheckInCount((c) => c + 1);
      } else if (result.message.includes('Already')) {
        setScanResult({ type: 'warning', message: result.message });
      } else {
        setScanResult({ type: 'error', message: result.message });
      }

      setProcessing(false);
      setTimeout(() => setCooldown(false), COOLDOWN_MS);
    },
    [eventId, processing, cooldown]
  );

  // ── Frame scan loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code?.data) handleQRResult(code.data);
      }
      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraActive, handleQRResult]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Overlay colors ────────────────────────────────────────────────
  const overlayColor: Record<ResultType, string> = {
    success: 'bg-green-500/90',
    warning: 'bg-yellow-500/90',
    error: 'bg-red-500/90',
  };

  const overlayTextColor: Record<ResultType, string> = {
    success: 'text-white',
    warning: 'text-gray-900',
    error: 'text-white',
  };

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Scanning for
          </p>
          <p className="font-bold text-gray-900 truncate">{eventTitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center px-4 py-2 bg-primary-50 rounded-xl">
            <p className="text-2xl font-black text-primary-600">{checkInCount}</p>
            <p className="text-[10px] text-primary-500 font-medium uppercase">
              Checked In
            </p>
          </div>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`p-3 rounded-xl transition-colors ${
              cameraActive
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            {cameraActive ? (
              <VideoCameraSlashIcon className="h-5 w-5" />
            ) : (
              <VideoCameraIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <VideoCameraSlashIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-semibold mb-1">Camera Unavailable</p>
          <p className="text-red-600 text-sm">{cameraError}</p>
        </div>
      )}

      {/* Camera Feed */}
      {!cameraError && (
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Idle state */}
          {!cameraActive && (
            <button
              onClick={startCamera}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 hover:text-white transition-colors"
            >
              <VideoCameraIcon className="h-16 w-16" />
              <span className="font-semibold text-lg">Tap to Start Camera</span>
            </button>
          )}

          {/* Scan overlay — corner brackets + animated line */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner brackets */}
              <div className="relative w-56 h-56">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* Animated scan line */}
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Processing indicator */}
              {processing && (
                <div className="absolute bottom-6 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <p className="text-white text-sm font-medium animate-pulse">
                    Verifying…
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Full-screen result overlay */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 flex flex-col items-center justify-center ${
                  overlayColor[scanResult.type]
                } ${overlayTextColor[scanResult.type]}`}
              >
                <button
                  onClick={() => setScanResult(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>

                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-5xl mb-4"
                >
                  {scanResult.type === 'success'
                    ? '✅'
                    : scanResult.type === 'warning'
                    ? '⚠️'
                    : '❌'}
                </motion.p>

                <p className="text-xl font-bold px-6 text-center">
                  {scanResult.message}
                </p>

                {scanResult.ticketType && (
                  <p className="mt-2 text-sm opacity-90 font-medium">
                    {scanResult.ticketType} Ticket
                  </p>
                )}

                <p className="mt-6 text-xs opacity-70">Tap ✕ or wait for next scan</p>

                {/* Auto-dismiss after cooldown */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/40"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: COOLDOWN_MS / 1000, ease: 'linear' }}
                  onAnimationComplete={() => setScanResult(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instructions */}
      {cameraActive && !scanResult && (
        <p className="text-center text-sm text-gray-500">
          Point camera at the attendee&apos;s QR code
        </p>
      )}
    </div>
  );
}
