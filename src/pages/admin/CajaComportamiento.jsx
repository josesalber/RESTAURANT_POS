import { useEffect, useState } from 'react';
import api from '@services/api';
import { formatCurrency, formatDate } from '@utils/format';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar,
  FiSearch, FiClock, FiCheckCircle, FiAlertTriangle,
  FiActivity, FiChevronDown, FiChevronUp, FiEye
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function CajaComportamiento() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [turnoExpandido, setTurnoExpandido] = useState(null);
  const [movimientosTurno, setMovimientosTurno] = useState({});

  const hoy = new Date();
  const hace30dias = new Date(hoy);
  hace30dias.setDate(hace30dias.getDate() - 30);
  const formatLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [fechaDesde, setFechaDesde] = useState(formatLocalDate(hace30dias));
  const [fechaHasta, setFechaHasta] = useState(formatLocalDate(hoy));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/caja/comportamiento', {
        params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
      });
      setData(response.data.data);
    } catch (error) {
      toast.error('Error al cargar datos de caja');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerMovimientos = async (turnoId) => {
    if (turnoExpandido === turnoId) {
      setTurnoExpandido(null);
      return;
    }
    setTurnoExpandido(turnoId);
    if (!movimientosTurno[turnoId]) {
      try {
        const response = await api.get(`/caja/turno/${turnoId}/movimientos`);
        setMovimientosTurno(prev => ({ ...prev, [turnoId]: response.data.data }));
      } catch (error) {
        toast.error('Error al cargar movimientos');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  const { metricas, diferencias, turnos, periodo } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Comportamiento de Caja</h2>
          <p className="text-cafe-500">Análisis y control de operaciones de caja</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="label text-xs">Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label text-xs">Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input" />
        </div>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <FiSearch className="w-4 h-4" /> Consultar
        </button>
      </div>

      {metricas && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiActivity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Total Turnos</p>
                  <p className="text-xl font-bold text-cafe-800">{metricas.total_turnos}</p>
                  <p className="text-xs text-cafe-400">{metricas.turnos_cerrados} cerrados</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Total Ingresos</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(parseFloat(metricas.total_ingresos))}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <FiTrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Total Egresos</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(parseFloat(metricas.total_egresos))}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <FiDollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Prom. Apertura</p>
                  <p className="text-xl font-bold text-cafe-800">{formatCurrency(parseFloat(metricas.promedio_apertura))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Diferencias / Precisión */}
          {diferencias && (
            <div className="card mb-6">
              <h4 className="text-md font-bold text-cafe-800 mb-4 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-500" />
                Precisión de Cierres
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-700">{diferencias.exactos || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Cierres Exactos</p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-700">{diferencias.sobrantes || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Sobrantes</p>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-700">{diferencias.faltantes || 0}</p>
                  <p className="text-xs text-red-600 mt-1">Faltantes</p>
                </div>
                <div className="text-center bg-beige-100 rounded-lg p-4">
                  <p className={clsx('text-2xl font-bold', parseFloat(diferencias.diferencia_neta) >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {formatCurrency(parseFloat(diferencias.diferencia_neta))}
                  </p>
                  <p className="text-xs text-cafe-500 mt-1">Diferencia Neta</p>
                </div>
              </div>
            </div>
          )}

          {/* Historial de turnos */}
          <div className="card overflow-hidden">
            <h4 className="text-md font-bold text-cafe-800 mb-4">Historial de Turnos</h4>
            {turnos && turnos.length > 0 ? (
              <div className="space-y-2">
                {turnos.map((turno) => (
                  <div key={turno.turno_id} className="border rounded-lg overflow-hidden">
                    {/* Encabezado turno */}
                    <div
                      className={clsx(
                        'flex items-center justify-between p-4 cursor-pointer hover:bg-beige-50 transition-colors',
                        !turno.cerrada && 'bg-green-50'
                      )}
                      onClick={() => handleVerMovimientos(turno.turno_id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          'p-2 rounded-full',
                          turno.cerrada ? 'bg-beige-200' : 'bg-green-200'
                        )}>
                          {turno.cerrada ? (
                            <FiCheckCircle className="w-5 h-5 text-cafe-500" />
                          ) : (
                            <FiClock className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-cafe-600">{turno.turno_id}</span>
                            <span className={clsx(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              turno.cerrada ? 'bg-beige-200 text-cafe-600' : 'bg-green-100 text-green-700'
                            )}>
                              {turno.cerrada ? 'Cerrada' : 'Abierta'}
                            </span>
                          </div>
                          <p className="text-xs text-cafe-400 mt-1">
                            {formatDate(turno.fecha_apertura, 'datetime')}
                            {turno.cerrada && turno.fecha_cierre && ` → ${formatDate(turno.fecha_cierre, 'datetime')}`}
                          </p>
                          <p className="text-xs text-cafe-400">
                            Abierta por: {turno.usuario_apertura}
                            {turno.cerrada && turno.usuario_cierre && ` | Cerrada por: ${turno.usuario_cierre}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-xs text-cafe-400">Apertura</p>
                          <p className="font-semibold text-cafe-800">{formatCurrency(parseFloat(turno.monto_apertura))}</p>
                        </div>
                        {turno.cerrada && (
                          <>
                            <div>
                              <p className="text-xs text-cafe-400">Cierre</p>
                              <p className="font-semibold text-cafe-800">{formatCurrency(parseFloat(turno.monto_cierre))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-cafe-400">Diferencia</p>
                              <p className={clsx('font-bold',
                                parseFloat(turno.diferencia) > 0 ? 'text-blue-600' :
                                  parseFloat(turno.diferencia) < 0 ? 'text-red-600' : 'text-green-600'
                              )}>
                                {parseFloat(turno.diferencia) > 0 ? '+' : ''}{formatCurrency(parseFloat(turno.diferencia))}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-xs text-cafe-400">Duración</p>
                          <p className="text-sm font-medium text-cafe-700">
                            {parseFloat(turno.horas_turno).toFixed(1)}h
                          </p>
                        </div>
                        {turnoExpandido === turno.turno_id ? (
                          <FiChevronUp className="w-5 h-5 text-cafe-400" />
                        ) : (
                          <FiChevronDown className="w-5 h-5 text-cafe-400" />
                        )}
                      </div>
                    </div>

                    {/* Detalle de movimientos */}
                    {turnoExpandido === turno.turno_id && movimientosTurno[turno.turno_id] && (
                      <div className="border-t bg-beige-50 p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-cafe-500">
                              <th className="pb-2">Hora</th>
                              <th className="pb-2">Tipo</th>
                              <th className="pb-2">Descripción</th>
                              <th className="pb-2">Usuario</th>
                              <th className="pb-2 text-right">Monto</th>
                              <th className="pb-2 text-right">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movimientosTurno[turno.turno_id].map((mov) => (
                              <tr key={mov.id} className="border-t border-beige-200">
                                <td className="py-2">
                                  {new Date(mov.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2">
                                  <span className={clsx('px-2 py-0.5 rounded text-xs font-medium',
                                    mov.tipo === 'apertura' ? 'bg-green-100 text-green-700' :
                                      mov.tipo === 'cierre' ? 'bg-gray-100 text-gray-700' :
                                        ['ingreso', 'deposito'].includes(mov.tipo) ? 'bg-blue-100 text-blue-700' :
                                          'bg-red-100 text-red-700'
                                  )}>
                                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                                  </span>
                                </td>
                                <td className="py-2 text-cafe-600">{mov.descripcion}</td>
                                <td className="py-2 text-cafe-500">{mov.usuario_nombre}</td>
                                <td className={clsx('py-2 text-right font-medium',
                                  ['ingreso', 'deposito', 'apertura'].includes(mov.tipo) ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {['egreso', 'retiro', 'cierre'].includes(mov.tipo) ? '-' : '+'}{formatCurrency(parseFloat(mov.monto))}
                                </td>
                                <td className="py-2 text-right text-cafe-700 font-medium">
                                  {formatCurrency(parseFloat(mov.saldo_actual))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-cafe-500">No hay registros de turnos en este período</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
