import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useConfigStore } from '@store/configStore';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiEye, FiEyeOff, FiDelete, FiGrid, FiCheck, FiArrowRight, FiHeadphones } from 'react-icons/fi';
import { HiOutlineKey } from 'react-icons/hi';
import { MdRestaurant } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Login() {
  const [mode, setMode] = useState('pin');
  const [pin, setPin] = useState('');
  const [formData, setFormData] = useState({ usuario: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loginWithPin, isLoading, error, clearError } = useAuthStore();
  const { config, loadConfig } = useConfigStore();
  const navigate = useNavigate();
  const maxDigits = 6;

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ─── PIN handlers ───
  const handlePinSubmit = useCallback(async (pinValue) => {
    if (pinValue.length !== maxDigits) {
      toast.error(`El PIN debe tener ${maxDigits} dígitos`);
      return;
    }
    const result = await loginWithPin(pinValue);
    if (result.success) {
      toast.success('¡Bienvenido!');
    } else {
      toast.error(result.message || 'PIN incorrecto');
      setPin('');
    }
  }, [loginWithPin, maxDigits]);

  const handleDigit = useCallback((digit) => {
    clearError();
    setPin(prev => {
      if (prev.length >= maxDigits) return prev;
      const newPin = prev + digit;
      if (newPin.length === maxDigits) {
        setTimeout(() => handlePinSubmit(newPin), 150);
      }
      return newPin;
    });
  }, [clearError, maxDigits, handlePinSubmit]);

  const handleDelete = () => {
    clearError();
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    clearError();
    setPin('');
  };

  // ─── Credentials handlers ───
  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usuario || !formData.password) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    const result = await login(formData.usuario, formData.password);
    if (result.success) {
      toast.success('¡Bienvenido!');
    } else {
      toast.error(result.message || 'Error al iniciar sesión');
    }
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    clearError();
    setMode(newMode);
    setPin('');
  };

  // Keyboard support for PIN
  useEffect(() => {
    if (mode !== 'pin') return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleDelete();
      if (e.key === 'Escape') handleClear();
      if (e.key === 'Enter' && pin.length === maxDigits) handlePinSubmit(pin);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleDigit, pin, handlePinSubmit]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'confirm'];

  return (
    <div>
      {/* ─── Logo & Title ─── */}
      <div className="flex flex-col items-center mb-5">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.img
            src="/logo.png"
            alt={config?.nombreRestaurante ? `${config.nombreRestaurante} logo` : 'Logo'}
            className="w-14 h-14 object-contain"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </motion.div>
        <h1 className="text-xl font-bold text-cafe-800 tracking-tight">
          {config.nombreRestaurante}
        </h1>
        <p className="text-[11px] text-gray-400 tracking-[0.15em] uppercase mt-1">
          {mode === 'pin' ? 'ACCESO RAPIDO' : 'SISTEMA POS'}
        </p>
      </div>

      {/* ─── Mode tabs ─── */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => switchMode('pin')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
            mode === 'pin'
              ? 'bg-oliva-500 text-white shadow-sm shadow-oliva-500/25'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <FiGrid className="w-4 h-4" />
          PIN Rápido
        </button>
        <button
          type="button"
          onClick={() => switchMode('credentials')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
            mode === 'credentials'
              ? 'bg-oliva-500 text-white shadow-sm shadow-oliva-500/25'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <HiOutlineKey className="w-4 h-4" />
          Credenciales
        </button>
      </div>

      {/* ─── Content ─── */}
      <AnimatePresence mode="wait">
        {mode === 'pin' ? (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* PIN dots in track */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full px-6 py-3 flex gap-3.5">
                {Array.from({ length: maxDigits }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={clsx(
                      'w-3 h-3 rounded-full transition-colors duration-200',
                      i < pin.length
                        ? 'bg-oliva-500'
                        : 'bg-gray-300'
                    )}
                    animate={i < pin.length ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm mb-4 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
              {digits.map((digit, index) => {
                if (digit === 'del') {
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={handleDelete}
                      onDoubleClick={handleClear}
                      disabled={isLoading || pin.length === 0}
                      className="aspect-square rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:scale-[0.92] transition-all duration-150 disabled:opacity-30 flex items-center justify-center"
                      title="Doble toque para borrar todo"
                    >
                      <FiDelete className="w-5 h-5" />
                    </button>
                  );
                }

                if (digit === 'confirm') {
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePinSubmit(pin)}
                      disabled={isLoading || pin.length !== maxDigits}
                      className="aspect-square rounded-2xl bg-oliva-500 text-white hover:bg-oliva-600 active:scale-[0.92] transition-all duration-150 disabled:opacity-40 flex items-center justify-center shadow-md shadow-oliva-500/30"
                    >
                      <FiCheck className="w-6 h-6" strokeWidth={3} />
                    </button>
                  );
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDigit(digit)}
                    disabled={isLoading || pin.length >= maxDigits}
                    className="aspect-square rounded-2xl bg-gray-50 border border-gray-200 text-cafe-700 hover:bg-gray-100 hover:border-gray-300 active:bg-oliva-50 active:border-oliva-300 active:scale-[0.92] transition-all duration-150 disabled:opacity-30 text-xl font-semibold flex items-center justify-center select-none"
                  >
                    {digit}
                  </button>
                );
              })}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center mt-5">
                <div className="w-5 h-5 border-2 border-oliva-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Usuario */}
              <div>
                <label htmlFor="usuario" className="block text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-1.5">
                  USUARIO
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-terracota-50 rounded-lg flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-terracota-400" />
                  </div>
                  <input
                    type="text"
                    id="usuario"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-cafe-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-oliva-500/20 focus:border-oliva-400 transition-all text-sm"
                    placeholder="Ingrese su usuario"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
                    CONTRASEÑA
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-terracota-50 rounded-lg flex items-center justify-center">
                    <FiLock className="w-4 h-4 text-terracota-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-14 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-cafe-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-oliva-500/20 focus:border-oliva-400 transition-all text-sm"
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-terracota-500 hover:bg-terracota-600 text-white py-3.5 rounded-xl text-base font-medium transition-all duration-200 shadow-md shadow-terracota-500/20 disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Ingresar al Sistema
                    <FiArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">Alpha</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
