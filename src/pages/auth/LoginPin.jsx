import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useConfigStore } from '@store/configStore';
import toast from 'react-hot-toast';
import { FiDelete, FiArrowLeft } from 'react-icons/fi';
import clsx from 'clsx';

export default function LoginPin() {
  const [pin, setPin] = useState('');
  const { loginWithPin, isLoading, error, clearError } = useAuthStore();
  const { config, loadConfig } = useConfigStore();
  const maxDigits = 6;

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleDigit = (digit) => {
    clearError();
    if (pin.length < maxDigits) {
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit cuando se completa el PIN
      if (newPin.length === maxDigits) {
        handleSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    clearError();
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    clearError();
    setPin('');
  };

  const handleSubmit = async (pinValue = pin) => {
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
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div>
      {/* Header con nombre del restaurante */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-oliva-600 mb-1">
          {config.nombreRestaurante}
        </h1>
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/login"
          className="w-10 h-10 flex items-center justify-center bg-beige-200 rounded-full hover:bg-beige-300 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-cafe-700" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Acceso Rápido</h2>
          <p className="text-cafe-500">Ingrese su PIN de {maxDigits} dígitos</p>
        </div>
      </div>

      {/* Indicador de PIN */}
      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: maxDigits }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'w-4 h-4 rounded-full transition-all duration-200',
              i < pin.length
                ? 'bg-oliva-400 scale-110'
                : 'bg-beige-300'
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-terracota-100 border border-terracota-300 text-terracota-700 px-4 py-3 rounded-button text-sm mb-4 text-center">
          {error}
        </div>
      )}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} />;
          }

          if (digit === 'del') {
            return (
              <button
                key={index}
                type="button"
                onClick={handleDelete}
                onDoubleClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="btn-touch bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200 disabled:opacity-50 aspect-square text-xl"
                title="Toque dos veces para borrar todo"
              >
                <FiDelete className="w-6 h-6 mx-auto" />
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={isLoading || pin.length >= maxDigits}
              className="btn-touch bg-beige-200 text-cafe-800 rounded-button hover:bg-beige-300 active:bg-oliva-100 disabled:opacity-50 aspect-square text-2xl font-semibold"
            >
              {digit}
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center mt-6">
          <div className="spinner" />
        </div>
      )}

      {/* Info */}
      <p className="text-center text-cafe-400 text-sm mt-8">
        El PIN se asigna en su perfil de usuario.
        <br />
        Toque dos veces el botón borrar para limpiar todo.
      </p>
    </div>
  );
}
