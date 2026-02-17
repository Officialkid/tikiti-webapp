'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SparklesIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 left-10 text-white/20 text-8xl"
      >
        🎉
      </motion.div>
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 right-10 text-white/20 text-8xl"
      >
        🎊
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <SparklesIcon className="w-5 h-5" />
            <span className="font-semibold">Limited Time Offer</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Ready to Experience
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              The Future of Events?
            </span>
          </h2>

          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join thousands of Kenyan students who are already enjoying safer, smarter events
          </p>

          {/* Benefits */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-yellow-300" />
              <span>Sign up in 30 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-pink-300" />
              <span>Free forever</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group relative px-10 py-5 bg-white text-primary-600 font-black rounded-full text-lg hover:bg-gray-100 transition-all shadow-2xl overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <span className="relative flex items-center justify-center gap-2">
                Create Free Account
                <SparklesIcon className="w-5 h-5" />
              </span>
            </Link>

            <Link
              href="/events"
              className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full text-lg hover:bg-white/10 backdrop-blur-sm transition-all"
            >
              Explore Events First
            </Link>
          </div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-2"
          >
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 border-2 border-white flex items-center justify-center text-sm font-bold"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm opacity-90">
              <span className="font-bold">10,000+</span> people trust Tikiti Store
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
