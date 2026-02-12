'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🛡️',
    title: 'Real-Time Safety',
    description: 'Live capacity tracking prevents overcrowding. Emergency alerts keep everyone safe.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: '📺',
    title: 'Hybrid Streaming',
    description: 'Can\'t make it? Buy a virtual ticket. Watch live from anywhere in Kenya.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: '👥',
    title: 'Squad Mode',
    description: 'See which friends are attending. Create squads and get group discounts.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: '📱',
    title: 'M-Pesa Payments',
    description: 'Pay instantly with M-Pesa or Airtel Money. Secure escrow protects your money.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: '🎟️',
    title: 'Digital QR Tickets',
    description: 'Fake-proof QR codes. Instant check-in. No more paper ticket scams.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: '🔒',
    title: 'Refund Protection',
    description: 'Plans change. Get 80% back if you cancel 48hrs before the event.',
    color: 'from-teal-500 to-teal-600',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            Built for Kenyan Events
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Every feature designed to solve real problems you face at events
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
