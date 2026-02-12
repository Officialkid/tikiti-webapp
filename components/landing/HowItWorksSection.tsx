'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Find Your Event',
    description: 'Browse events by category, date, or campus. Filter by virtual ticket availability.',
    icon: '🔍',
    color: 'from-primary-500 to-primary-600',
  },
  {
    number: '02',
    title: 'Choose Your Experience',
    description: 'Buy physical tickets or virtual streaming passes. Create squads with friends.',
    icon: '🎫',
    color: 'from-secondary-500 to-secondary-600',
  },
  {
    number: '03',
    title: 'Pay Securely',
    description: 'Pay with M-Pesa. Your money is held in escrow until the event happens.',
    icon: '💳',
    color: 'from-accent-500 to-accent-600',
  },
  {
    number: '04',
    title: 'Attend & Enjoy',
    description: 'Show your QR code at the gate. Track capacity in real-time. Stay safe.',
    icon: '🎉',
    color: 'from-green-500 to-green-600',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From discovery to entry — we've made it simple
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-300 dark:from-gray-700 dark:to-gray-700 z-0" />
              )}

              {/* Card */}
              <div className="relative z-10 text-center">
                {/* Number Badge */}
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${step.color} text-white text-3xl font-black mb-6 shadow-lg`}>
                  {step.icon}
                </div>
                
                {/* Step Number */}
                <div className="text-6xl font-black text-gray-200 dark:text-gray-700 mb-2">
                  {step.number}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
