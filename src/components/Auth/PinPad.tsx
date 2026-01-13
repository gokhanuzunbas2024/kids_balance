import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Loader2 } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  isLoading?: boolean;
  error?: string;
  length?: number;
}

export function PinPad({ onComplete, isLoading, error, length = 4 }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === length && !isLoading) {
      onComplete(pin);
    }
  }, [pin, length, onComplete, isLoading]);

  const handleDigit = (digit: string) => {
    if (pin.length < length && !isLoading) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (!isLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isLoading) {
      setPin('');
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="w-full max-w-xs">
      {/* PIN Dots */}
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex justify-center gap-4 mb-8"
      >
        {[...Array(length)].map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: pin.length > i ? 1.2 : 1,
              backgroundColor: pin.length > i ? '#6366f1' : '#e5e7eb',
            }}
            className="w-4 h-4 rounded-full"
          />
        ))}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-red-500 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} />;
          }
          
          if (digit === 'del') {
            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                onDoubleClick={handleClear}
                disabled={isLoading}
                className="aspect-square rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50"
              >
                <Delete className="h-6 w-6" />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDigit(digit)}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-gray-100 hover:bg-indigo-100 text-2xl font-semibold text-gray-800 transition-colors disabled:opacity-50"
            >
              {digit}
            </motion.button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Double-tap delete to clear
      </p>
    </div>
  );
}
