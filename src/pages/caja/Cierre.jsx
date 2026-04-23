import { useEffect, useState } from 'react';
import { useCajaStore } from '@store/cajaStore';
import { formatCurrency } from '@utils/format';
import {
  FiDollarSign,
  FiLock,
  FiUnlock,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiPrinter,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function CajaCierre() {
  const {
    estadoCaja,
    fetchEstadoCaja,
    abrirCaja,
    cerrarCaja,
    fetchResumenDia,
    resumenDia,
    isLoading,
  } = useCajaStore();

  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cierreExitoso, setCierreExitoso] = useState(null);

  useEffect(() => {
    fetchEstadoCaja();
    fetchResumenDia();
  }, []);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();

    if (!montoInicial || parseFloat(montoInicial) < 0) {
      toast.error('Ingrese un monto inicial válido');
      return;
    }

    setIsSubmitting(true);

    const result = await abrirCaja(parseFloat(montoInicial), observaciones);

    if (result.success) {
      toast.success('Caja abierta exitosamente');
      setMontoInicial('');
      setObservaciones('');
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  const handleCerrarCaja = async (e) => {
    e.preventDefault();

    if (!montoFinal || parseFloat(montoFinal) < 0) {
      toast.error('Ingrese el monto final contado');
      return;
    }

    setIsSubmitting(true);

    const result = await cerrarCaja(parseFloat(montoFinal), observaciones);

    if (result.success) {
      toast.success('Caja cerrada exitosamente');
      setCierreExitoso(result.data);
      setMontoFinal('');
      setObservaciones('');
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  const handleImprimirCorte = () => {
    if (!cierreExitoso) return;
    const resumen = cierreExitoso.resumen || {};
    const montoInicial = parseFloat(resumen.monto_apertura || 0);
    const totalIngresos = parseFloat(resumen.total_ingresos || 0);
    const totalEgresos = parseFloat(resumen.total_egresos || 0);
    const saldoEsperado = parseFloat(resumen.saldo_esperado || 0);
    const montoContado = parseFloat(resumen.monto_real || 0);
    const diferencia = parseFloat(resumen.diferencia || 0);

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }
    printWindow.document.write(`
      <html>
      <head>
        <title>Cierre de Caja</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; font-size: 14px; }
          h2 { text-align: center; margin-bottom: 4px; }
          .fecha { text-align: center; font-size: 12px; color: #666; margin-bottom: 16px; }
          .linea { border-top: 1px dashed #ccc; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; }
          .total { font-weight: bold; font-size: 16px; }
          .diff-pos { color: green; }
          .diff-neg { color: red; }
          .footer { text-align: center; font-size: 11px; color: #999; margin-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h2>CIERRE DE CAJA</h2>
        <p class="fecha">${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</p>
        <div class="linea"></div>
        <div class="row"><span>Monto inicial</span><span>${formatCurrency(montoInicial)}</span></div>
        <div class="row"><span>Ingresos</span><span>${formatCurrency(totalIngresos)}</span></div>
        <div class="row"><span>Egresos</span><span>-${formatCurrency(totalEgresos)}</span></div>
        <div class="linea"></div>
        <div class="row"><span>Saldo esperado</span><span>${formatCurrency(saldoEsperado)}</span></div>
        <div class="row"><span>Monto contado</span><span>${formatCurrency(montoContado)}</span></div>
        <div class="linea"></div>
        <div class="row total"><span>Diferencia</span><span class="${diferencia >= 0 ? 'diff-pos' : 'diff-neg'}">${diferencia >= 0 ? '+' : ''}${formatCurrency(diferencia)}</span></div>
        <div class="linea"></div>
        <p class="footer">Documento generado automáticamente</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Si el cierre fue exitoso, mostrar resumen
  if (cierreExitoso) {
    const resumen = cierreExitoso.resumen || {};
    const montoInicial = parseFloat(resumen.monto_apertura || 0);
    const totalIngresos = parseFloat(resumen.total_ingresos || 0);
    const totalEgresos = parseFloat(resumen.total_egresos || 0);
    const saldoEsperado = parseFloat(resumen.saldo_esperado || 0);
    const montoContado = parseFloat(resumen.monto_real || 0);
    const diferencia = parseFloat(resumen.diferencia || 0);

    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center py-8">
          <div className="w-20 h-20 bg-estado-disponible/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-cafe-800 mb-2">Caja Cerrada</h2>
          <p className="text-cafe-500 mb-6">
            Cierre realizado el{' '}
            {format(new Date(), "d 'de' MMMM, HH:mm", { locale: es })}
          </p>

          <div className="bg-beige-100 rounded-button p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-cafe-600">
              <span>Monto inicial</span>
              <span>{formatCurrency(montoInicial)}</span>
            </div>
            <div className="flex justify-between text-cafe-600">
              <span>Ingresos (ventas + depósitos)</span>
              <span>{formatCurrency(totalIngresos)}</span>
            </div>
            {totalEgresos > 0 && (
              <div className="flex justify-between text-cafe-600">
                <span>Egresos / Retiros</span>
                <span>-{formatCurrency(totalEgresos)}</span>
              </div>
            )}
            <div className="flex justify-between text-cafe-600 font-medium">
              <span>Saldo esperado</span>
              <span>{formatCurrency(saldoEsperado)}</span>
            </div>
            <div className="flex justify-between text-cafe-600">
              <span>Monto contado</span>
              <span>{formatCurrency(montoContado)}</span>
            </div>
            <div
              className={`flex justify-between font-bold text-lg pt-2 border-t border-beige-300 ${
                diferencia >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span>Diferencia</span>
              <span>
                {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImprimirCorte}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <FiPrinter className="w-5 h-5" />
              Imprimir
            </button>
            <button
              onClick={() => setCierreExitoso(null)}
              className="btn-primary flex-1"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-cafe-800 mb-6">
        {estadoCaja?.abierta ? 'Cierre de Caja' : 'Apertura de Caja'}
      </h2>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
        {/* Estado actual */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4 flex items-center gap-2">
            {estadoCaja?.abierta ? (
              <>
                <FiUnlock className="w-5 h-5 text-green-600" />
                Caja Abierta
              </>
            ) : (
              <>
                <FiLock className="w-5 h-5 text-red-600" />
                Caja Cerrada
              </>
            )}
          </h3>

          {estadoCaja?.abierta ? (
            <div className="space-y-4">
              {/* Alerta si el monto inicial es 0 */}
              {parseFloat(estadoCaja.montoInicial || 0) === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-button p-3 flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Caja sin fondo inicial</p>
                    <p className="text-yellow-700">
                      Se recomienda cerrar y reabrir la caja con un monto inicial para facilitar cambios.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-beige-100 rounded-button p-4">
                <div className="flex justify-between text-cafe-600 mb-2">
                  <span>Apertura</span>
                  <span>
                    {estadoCaja.fechaApertura &&
                      format(new Date(estadoCaja.fechaApertura), 'HH:mm', {
                        locale: es,
                      })}
                  </span>
                </div>
                <div className="flex justify-between text-cafe-600 mb-2">
                  <span>Monto inicial</span>
                  <span>{formatCurrency(parseFloat(estadoCaja.montoInicial || 0))}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-cafe-800 pt-2 border-t border-beige-300">
                  <span>Saldo actual</span>
                  <span>{formatCurrency(estadoCaja.saldoActual || 0)}</span>
                </div>
              </div>

              {/* Resumen del día */}
              {resumenDia && (
                <div className="space-y-2">
                  <h4 className="font-medium text-cafe-700">Resumen del día</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-green-50 p-2 rounded">
                      <span className="text-green-600">Efectivo</span>
                      <p className="font-bold text-green-700">
                        {formatCurrency(resumenDia.efectivo || 0)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <span className="text-blue-600">Tarjeta</span>
                      <p className="font-bold text-blue-700">
                        {formatCurrency(resumenDia.tarjeta || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <span className="text-purple-600">Transferencia</span>
                      <p className="font-bold text-purple-700">
                        {formatCurrency(resumenDia.transferencia || 0)}
                      </p>
                    </div>
                    <div className="bg-oliva-50 p-2 rounded">
                      <span className="text-oliva-600">Total</span>
                      <p className="font-bold text-oliva-700">
                        {formatCurrency(resumenDia.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-beige-100 rounded-button p-4 text-center">
              <FiAlertCircle className="w-12 h-12 mx-auto text-cafe-400 mb-2" />
              <p className="text-cafe-600">
                Abra la caja para comenzar a operar
              </p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="card">
          {estadoCaja?.abierta ? (
            // Formulario de cierre
            <form onSubmit={handleCerrarCaja}>
              <h3 className="font-semibold text-cafe-800 mb-4 flex items-center gap-2">
                <FiLock className="w-5 h-5" />
                Cerrar Caja
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Monto Final Contado</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-400" />
                    <input
                      type="number"
                      value={montoFinal}
                      onChange={(e) => setMontoFinal(e.target.value)}
                      placeholder="0.00"
                      className="input pl-10 text-xl"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-sm text-cafe-500 mt-1">
                    Saldo esperado: {formatCurrency(estadoCaja.saldoActual || 0)}
                  </p>
                </div>

                <div>
                  <label className="label">Observaciones (opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas del cierre..."
                    className="input resize-none"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-danger w-full py-3"
                >
                  {isSubmitting ? 'Cerrando...' : 'Cerrar Caja'}
                </button>
              </div>
            </form>
          ) : (
            // Formulario de apertura
            <form onSubmit={handleAbrirCaja}>
              <h3 className="font-semibold text-cafe-800 mb-4 flex items-center gap-2">
                <FiUnlock className="w-5 h-5" />
                Abrir Caja
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Monto Inicial</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-400" />
                    <input
                      type="number"
                      value={montoInicial}
                      onChange={(e) => setMontoInicial(e.target.value)}
                      placeholder="0.00"
                      className="input pl-10 text-xl"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-sm text-cafe-500 mt-1">
                    Fondo de caja para dar cambio
                  </p>
                </div>

                <div>
                  <label className="label">Observaciones (opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas de apertura..."
                    className="input resize-none"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3"
                >
                  {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
