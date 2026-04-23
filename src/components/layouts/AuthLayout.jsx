import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }) {
  useEffect(() => {
    document.body.style.touchAction = 'manipulation';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-beige-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 0.5px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] p-6 sm:p-8"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
