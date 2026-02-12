'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 1,
    title: 'Kenya\'s Safest Event Platform',
    subtitle: 'Real-time capacity tracking ensures you\'re never in a crowd that\'s too big',
    bg: 'from-primary-900/70 to-primary-600/50',
    image: '/images/hero-1.jpg', // Use a dark event crowd image
  },
  {
    id: 2,
    title: 'Can\'t Attend? Stream Live.',
    subtitle: 'Buy a virtual ticket and experience the event from home at 30% of the price',
    bg: 'from-secondary-900/70 to-secondary-600/50',
    image: '/images/hero-2.jpg',
  },
  {
    id: 3,
    title: 'Go With Your Squad',
    subtitle: 'Create squads, see who\'s attending, and stay connected at the venue',
    bg: 'from-accent-900/70 to-accent-600/50',
    image: '/images/hero-3.jpg',
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Replace with Next.js Image in production */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].bg}`} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 z-10">
          <Link
            href="/events"
            className="px-8 py-4 bg-white text-primary-600 font-bold rounded-full text-lg hover:bg-gray-100 transition-colors shadow-xl"
          >
            Browse Events
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-secondary-500 text-white font-bold rounded-full text-lg hover:bg-secondary-600 transition-colors shadow-xl animate-pulse"
          >
            Get Started Free
          </Link>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
