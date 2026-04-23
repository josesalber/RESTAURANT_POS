import { useState } from 'react';
import api from '@services/api';
import {
  FiCalendar,
  FiDownload,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingBag,
  FiClock,
  FiBarChart2,
  FiUsers,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp as FiTrendingUpIcon,
  FiFileText,
  FiBox,
  FiAlertTriangle,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { formatCurrency } from '@utils/format';

// Constantes globales
const COLORS = ['#889E81', '#CB6D51', '#4E342E', '#60A5FA', '#FBBF24'];

// Componentes de pestañas
const VentasTab = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* KPIs de Ventas */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
        {data.comparativaVentas && (
          <>
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Variación Ventas</p>
                  <p className={`text-2xl font-bold ${data.comparativaVentas.variaciones.ventas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.comparativaVentas.variaciones.ventas >= 0 ? '+' : ''}{data.comparativaVentas.variaciones.ventas}%
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.comparativaVentas.variaciones.ventas >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {data.comparativaVentas.variaciones.ventas >= 0 ? <FiTrendingUpIcon className="w-5 h-5" /> : <FiTrendingDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Variación Pedidos</p>
                  <p className={`text-2xl font-bold ${data.comparativaVentas.variaciones.pedidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.comparativaVentas.variaciones.pedidos >= 0 ? '+' : ''}{data.comparativaVentas.variaciones.pedidos}%
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.comparativaVentas.variaciones.pedidos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {data.comparativaVentas.variaciones.pedidos >= 0 ? <FiTrendingUpIcon className="w-5 h-5" /> : <FiTrendingDown className="w-5 h-5" />}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Gráficas de Ventas */}
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
        {/* Ventas por hora */}
        {data.ventasHora && (
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Ventas por Hora</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ventasHora}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis dataKey="hora" stroke="#7F6A5F" />
                  <YAxis stroke="#7F6A5F" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Ventas']}
                    labelFormatter={(hora) => `${hora}:00`}
                  />
                  <Bar dataKey="total_ventas" fill="#2D5F3D" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Ventas por día de semana */}
        {data.ventasDiaSemana && (
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Ventas por Día de Semana</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ventasDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis dataKey="dia_nombre" stroke="#7F6A5F" />
                  <YAxis stroke="#7F6A5F" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Ventas']}
                  />
                  <Bar dataKey="total_ventas" fill="#CB6D51" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Tasa de crecimiento */}
      {data.tasaCrecimiento && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Tasa de Crecimiento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.tasaCrecimiento}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="periodo" stroke="#7F6A5F" />
                <YAxis stroke="#7F6A5F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => [
                    name === 'crecimiento_ventas' ? `${value}%` : formatCurrency(value),
                    name === 'crecimiento_ventas' ? 'Crecimiento Ventas' : 'Ventas Totales'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="total_ventas"
                  stroke="#2D5F3D"
                  strokeWidth={2}
                  name="total_ventas"
                />
                <Line
                  type="monotone"
                  dataKey="crecimiento_ventas"
                  stroke="#CB6D51"
                  strokeWidth={2}
                  name="crecimiento_ventas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ventas por tipo de servicio */}
      {data.ventasTipoServicio && data.ventasTipoServicio.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Ventas por Tipo de Servicio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.ventasTipoServicio}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ tipo, percent }) =>
                    `${tipo} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_ventas"
                  nameKey="tipo"
                >
                  {data.ventasTipoServicio.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Ventas']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductosTab = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Análisis ABC */}
      {data.analisisABC && (
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Análisis ABC - Resumen</h3>
            <div className="space-y-4">
              {Object.entries(data.analisisABC.resumen).map(([clase, info]) => (
                <div key={clase} className="flex items-center justify-between p-3 bg-beige-100 rounded-lg">
                  <div>
                    <p className="font-medium text-cafe-800">Clase {clase}</p>
                    <p className="text-sm text-cafe-500">{info.productos} productos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cafe-800">{info.porcentaje.toFixed(1)}%</p>
                    <p className="text-sm text-cafe-500">de ventas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Distribución ABC</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(data.analisisABC.resumen).map(([clase, info]) => ({
                      name: `Clase ${clase}`,
                      value: info.porcentaje,
                      productos: info.productos
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {Object.keys(data.analisisABC.resumen).map((clase, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Porcentaje']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Velocidad de venta por producto */}
      {data.velocidadProductos && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Velocidad de Venta por Producto</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.velocidadProductos.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="nombre" stroke="#7F6A5F" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#7F6A5F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value.toFixed(2), 'Unidades/día']}
                />
                <Bar dataKey="velocidad_diaria" fill="#4E342E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const PersonalTab = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Eficiencia de meseros */}
      {data.eficienciaMeseros && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Eficiencia de Meseros</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-4 text-cafe-700">Mesero</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Pedidos</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Ventas Totales</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Pedidos/Día</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Ventas/Día</th>
                </tr>
              </thead>
              <tbody>
                {data.eficienciaMeseros.map((mesero, index) => (
                  <tr key={index} className="border-b border-cafe-100">
                    <td className="py-2 px-4 text-cafe-800 font-medium">{mesero.nombre}</td>
                    <td className="py-2 px-4 text-right">{mesero.total_pedidos}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(mesero.total_ventas)}</td>
                    <td className="py-2 px-4 text-right">{mesero.pedidos_por_dia}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(mesero.ventas_por_dia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pedidos por mesero */}
      {data.pedidosMesero && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Pedidos por Mesero</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pedidosMesero} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis type="number" stroke="#7F6A5F" />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  width={120}
                  stroke="#7F6A5F"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value, 'Pedidos']}
                />
                <Bar dataKey="total_pedidos" fill="#CB6D51" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const FinancieroTab = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Flujo de caja */}
      {data.flujoCaja && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Flujo de Caja</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-4 text-cafe-700">Fecha</th>
                  <th className="text-left py-2 px-4 text-cafe-700">Cajero</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Saldo Inicial</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Entradas</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Salidas</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Saldo Final</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {data.flujoCaja.map((caja, index) => (
                  <tr key={index} className="border-b border-cafe-100">
                    <td className="py-2 px-4 text-cafe-800">{new Date(caja.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="py-2 px-4 text-cafe-800">{caja.cajero}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(caja.saldo_inicial)}</td>
                    <td className="py-2 px-4 text-right text-green-600">+{formatCurrency(caja.total_entradas)}</td>
                    <td className="py-2 px-4 text-right text-red-600">-{formatCurrency(caja.total_salidas)}</td>
                    <td className="py-2 px-4 text-right font-medium">{formatCurrency(caja.saldo_final)}</td>
                    <td className={`py-2 px-4 text-right font-medium ${caja.diferencia_real >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {caja.diferencia_real >= 0 ? '+' : ''}{formatCurrency(caja.diferencia_real)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comisiones por método de pago */}
      {data.comisionesMetodo && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Comisiones por Método de Pago</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-4 text-cafe-700">Método</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Transacciones</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Total Ventas</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Propina Promedio</th>
                  <th className="text-right py-2 px-4 text-cafe-700">Comisión Estimada</th>
                </tr>
              </thead>
              <tbody>
                {data.comisionesMetodo.map((metodo, index) => (
                  <tr key={index} className="border-b border-cafe-100">
                    <td className="py-2 px-4 text-cafe-800 font-medium">{metodo.metodo_pago}</td>
                    <td className="py-2 px-4 text-right">{metodo.total_transacciones}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(metodo.total_ventas)}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(metodo.propina_promedio)}</td>
                    <td className="py-2 px-4 text-right text-red-600">-{formatCurrency(metodo.comision_estimada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const OperacionalTab = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Ticket promedio por tipo de servicio */}
      {data.ticketTipoServicio && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Ticket Promedio por Tipo de Servicio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ticketTipoServicio}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="tipo" stroke="#7F6A5F" />
                <YAxis stroke="#7F6A5F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [formatCurrency(value), 'Ticket Promedio']}
                />
                <Bar dataKey="ticket_promedio" fill="#60A5FA" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ticket promedio por día de semana */}
      {data.ticketDiaSemana && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Ticket Promedio por Día de Semana</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ticketDiaSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="dia_nombre" stroke="#7F6A5F" />
                <YAxis stroke="#7F6A5F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [formatCurrency(value), 'Ticket Promedio']}
                />
                <Bar dataKey="ticket_promedio" fill="#FBBF24" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribución de tickets */}
      {data.distribucionTickets && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Distribución de Tickets por Rangos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribucionTickets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="rango" stroke="#7F6A5F" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#7F6A5F" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E6C8',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => [
                    name === 'cantidad_pedidos' ? value : formatCurrency(value),
                    name === 'cantidad_pedidos' ? 'Pedidos' : 'Total Ventas'
                  ]}
                />
                <Bar dataKey="cantidad_pedidos" fill="#889E81" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== TAB: FACTURACIÓN =====
const FacturacionTab = ({ data }) => {
  if (!data) return <div className="card text-center py-12"><p className="text-cafe-500">No hay datos de facturación</p></div>;

  const { totales = {}, porTipo = [], porEstado = [], porDia = [], comprobantes = [] } = data;

  const tipoData = porTipo.map(t => ({
    name: t.tipo_comprobante === '03' ? 'Boletas' : t.tipo_comprobante === '01' ? 'Facturas' : t.tipo_comprobante,
    cantidad: parseInt(t.cantidad) || 0,
    monto: parseFloat(t.monto_total) || 0,
  }));

  const estadoColors = { aceptado: '#889E81', rechazado: '#CB6D51', pendiente: '#FBBF24', error: '#EF4444' };
  const estadoData = porEstado.map(e => ({
    name: e.estado.charAt(0).toUpperCase() + e.estado.slice(1),
    value: parseInt(e.cantidad) || 0,
    fill: estadoColors[e.estado] || '#4E342E',
  }));

  const dailyData = (porDia || []).map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    boletas: parseInt(d.boletas) || 0,
    facturas: parseInt(d.facturas) || 0,
    monto: parseFloat(d.monto_total) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Comprobantes', value: totales.total_comprobantes || 0, icon: FiFileText, color: 'text-blue-600' },
          { label: 'Monto Total', value: formatCurrency(parseFloat(totales.monto_total) || 0), icon: FiDollarSign, color: 'text-green-600' },
          { label: 'IGV Total', value: formatCurrency(parseFloat(totales.igv_total) || 0), icon: FiTrendingUp, color: 'text-amber-600' },
          { label: 'Base Imponible', value: formatCurrency(parseFloat(totales.base_imponible) || 0), icon: FiTarget, color: 'text-cafe-600' },
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-crema-100 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-cafe-500">{kpi.label}</p>
                <p className="text-lg font-bold text-cafe-800">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribución por tipo */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Distribución por Tipo</h3>
          {tipoData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tipoData} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tipoData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val, name, props) => [val, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-cafe-400 text-center py-8">Sin datos</p>}
        </div>

        {/* Estado de comprobantes */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Estado SUNAT</h3>
          {estadoData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estadoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis dataKey="name" stroke="#7F6A5F" />
                  <YAxis stroke="#7F6A5F" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6C8', borderRadius: '8px' }} />
                  <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                    {estadoData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-cafe-400 text-center py-8">Sin datos</p>}
        </div>
      </div>

      {/* Comprobantes por día */}
      {dailyData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Comprobantes por Día</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                <XAxis dataKey="fecha" stroke="#7F6A5F" fontSize={12} />
                <YAxis yAxisId="left" stroke="#7F6A5F" />
                <YAxis yAxisId="right" orientation="right" stroke="#7F6A5F" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6C8', borderRadius: '8px' }} />
                <Bar yAxisId="left" dataKey="boletas" name="Boletas" fill="#889E81" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="left" dataKey="facturas" name="Facturas" fill="#CB6D51" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="monto" name="Monto" stroke="#4E342E" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de comprobantes recientes */}
      {comprobantes && comprobantes.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Últimos Comprobantes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-crema-200">
                  <th className="text-left py-2 px-3 text-cafe-600">Serie-Número</th>
                  <th className="text-left py-2 px-3 text-cafe-600">Tipo</th>
                  <th className="text-left py-2 px-3 text-cafe-600">Pedido</th>
                  <th className="text-right py-2 px-3 text-cafe-600">Monto</th>
                  <th className="text-center py-2 px-3 text-cafe-600">Estado</th>
                  <th className="text-left py-2 px-3 text-cafe-600">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {comprobantes.slice(0, 20).map((c, i) => (
                  <tr key={i} className="border-b border-crema-100 hover:bg-crema-50">
                    <td className="py-2 px-3 font-mono text-xs">{c.serie}-{c.numero}</td>
                    <td className="py-2 px-3">{c.tipo_comprobante === '03' ? 'Boleta' : c.tipo_comprobante === '01' ? 'Factura' : c.tipo_comprobante}</td>
                    <td className="py-2 px-3">#{c.numero_pedido || c.pedido_id}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(parseFloat(c.monto_total) || 0)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.estado === 'aceptado' ? 'bg-green-100 text-green-700' :
                        c.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.estado === 'aceptado' ? '✓' : c.estado === 'rechazado' ? '✗' : '⏳'} {c.estado}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-cafe-500">{new Date(c.created_at).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen por tipo */}
      {tipoData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Resumen por Tipo de Comprobante</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {tipoData.map((tipo, i) => (
              <div key={i} className="bg-crema-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="font-medium text-cafe-800">{tipo.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-cafe-500">Cantidad:</span> <span className="font-medium">{tipo.cantidad}</span></div>
                  <div><span className="text-cafe-500">Monto:</span> <span className="font-medium">{formatCurrency(tipo.monto)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== TAB: INVENTARIO =====
const InventarioTab = ({ data }) => {
  if (!data) return <div className="card text-center py-12"><p className="text-cafe-500">Genere el reporte para ver datos de inventario</p></div>;

  const { valorizacion, movimientos, consumoTop, proveedores } = data;

  return (
    <div className="space-y-6">
      {/* KPIs de Inventario */}
      {valorizacion && (
        <div className="grid grid-cols-2 desktop:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-cafe-500">Valor del Inventario</p>
                <p className="text-2xl font-bold text-cafe-800">{formatCurrency(valorizacion.resumen.total_valor)}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                <FiDollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-cafe-500">Total Ingredientes</p>
                <p className="text-2xl font-bold text-cafe-800">{valorizacion.resumen.total_items}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                <FiBox className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-cafe-500">Stock Cr\u00edtico</p>
                <p className="text-2xl font-bold text-red-600">{valorizacion.resumen.items_criticos}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-cafe-500">Stock Bajo</p>
                <p className="text-2xl font-bold text-amber-600">{valorizacion.resumen.items_bajos}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600">
                <FiTrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valorización detallada */}
      {valorizacion && valorizacion.items.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Valorización del Inventario</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-3 text-cafe-700">Ingrediente</th>
                  <th className="text-left py-2 px-3 text-cafe-700">Categoría</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Stock</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Costo Unit.</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Valor Total</th>
                  <th className="text-center py-2 px-3 text-cafe-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {valorizacion.items.map((item, i) => (
                  <tr key={i} className="border-b border-cafe-100">
                    <td className="py-2 px-3 font-medium text-cafe-800">{item.nombre}</td>
                    <td className="py-2 px-3">{item.categoria}</td>
                    <td className="py-2 px-3 text-right">{parseFloat(item.stock_actual).toFixed(2)} {item.unidad_medida}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(parseFloat(item.costo_unitario))}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(parseFloat(item.valor_total))}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.estado_stock === 'critico' ? 'bg-red-100 text-red-700' :
                        item.estado_stock === 'bajo' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.estado_stock === 'critico' ? 'Cr\u00edtico' : item.estado_stock === 'bajo' ? 'Bajo' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-cafe-300">
                  <td colSpan="4" className="py-2 px-3 text-right font-bold text-cafe-800">TOTAL INVENTARIO:</td>
                  <td className="py-2 px-3 text-right font-bold text-lg text-cafe-800">{formatCurrency(valorizacion.resumen.total_valor)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
        {/* Top consumo */}
        {consumoTop && consumoTop.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Top 20 Ingredientes M\u00e1s Consumidos (30 d\u00edas)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumoTop.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis type="number" stroke="#7F6A5F" />
                  <YAxis dataKey="nombre" type="category" width={120} stroke="#7F6A5F" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6C8', borderRadius: '8px' }}
                    formatter={(value, name) => [
                      name === 'costo_estimado' ? formatCurrency(parseFloat(value)) : `${parseFloat(value).toFixed(2)}`,
                      name === 'costo_estimado' ? 'Costo Estimado' : 'Consumido'
                    ]}
                  />
                  <Bar dataKey="total_consumido" name="Consumido" fill="#CB6D51" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Proveedores */}
        {proveedores && proveedores.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">Compras por Proveedor</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proveedores.map(p => ({ name: p.proveedor, value: parseFloat(p.monto_total) || 0 }))}
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value" nameKey="name"
                  >
                    {proveedores.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Monto']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E6C8', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Movimientos: Ingresos vs Consumo */}
      {movimientos && (
        <>
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-2">Resumen de Movimientos</h3>
            <p className="text-sm text-cafe-400 mb-4">{movimientos.fecha_desde} al {movimientos.fecha_hasta}</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-beige-100 rounded-lg p-4 text-center">
                <p className="text-sm text-cafe-500">Órdenes de Ingreso</p>
                <p className="text-xl font-bold text-cafe-800">{movimientos.resumen.total_ordenes}</p>
              </div>
              <div className="bg-beige-100 rounded-lg p-4 text-center">
                <p className="text-sm text-cafe-500">Inversión Total</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(movimientos.resumen.monto_ordenes)}</p>
              </div>
              <div className="bg-beige-100 rounded-lg p-4 text-center">
                <p className="text-sm text-cafe-500">Ingredientes Ingresados</p>
                <p className="text-xl font-bold text-cafe-800">{movimientos.ingresos.length}</p>
              </div>
            </div>
          </div>

          {/* Tabla de ingresos por ingrediente */}
          {movimientos.ingresos.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-4">Ingresos por Ingrediente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cafe-200">
                      <th className="text-left py-2 px-3 text-cafe-700">Ingrediente</th>
                      <th className="text-right py-2 px-3 text-cafe-700">Total Ingresado</th>
                      <th className="text-right py-2 px-3 text-cafe-700">Costo Total</th>
                      <th className="text-right py-2 px-3 text-cafe-700">N° Órdenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.ingresos.map((ing, i) => (
                      <tr key={i} className="border-b border-cafe-100">
                        <td className="py-2 px-3 font-medium">{ing.ingrediente}</td>
                        <td className="py-2 px-3 text-right">{parseFloat(ing.total_ingresado).toFixed(2)} {ing.unidad_medida}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatCurrency(parseFloat(ing.total_costo))}</td>
                        <td className="py-2 px-3 text-right">{ing.num_ordenes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla de consumo */}
          {movimientos.consumos.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-4">Consumo por Ingrediente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cafe-200">
                      <th className="text-left py-2 px-3 text-cafe-700">Ingrediente</th>
                      <th className="text-right py-2 px-3 text-cafe-700">Total Consumido</th>
                      <th className="text-right py-2 px-3 text-cafe-700">Registros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.consumos.map((con, i) => (
                      <tr key={i} className="border-b border-cafe-100">
                        <td className="py-2 px-3 font-medium">{con.ingrediente}</td>
                        <td className="py-2 px-3 text-right text-terracota-600 font-semibold">{parseFloat(con.total_consumido).toFixed(2)} {con.unidad_medida}</td>
                        <td className="py-2 px-3 text-right">{con.registros}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top consumo detallado */}
      {consumoTop && consumoTop.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">An\u00e1lisis de Consumo - Top 20 (Últimos 30 d\u00edas)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-3 text-cafe-700">Ingrediente</th>
                  <th className="text-left py-2 px-3 text-cafe-700">Categoría</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Consumido</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Costo Estimado</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Días Uso</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Promedio/Día</th>
                </tr>
              </thead>
              <tbody>
                {consumoTop.map((item, i) => (
                  <tr key={i} className="border-b border-cafe-100">
                    <td className="py-2 px-3 font-medium">{item.nombre}</td>
                    <td className="py-2 px-3"><span className="px-2 py-0.5 bg-beige-200 rounded text-xs">{item.categoria}</span></td>
                    <td className="py-2 px-3 text-right">{parseFloat(item.total_consumido).toFixed(2)} {item.unidad_medida}</td>
                    <td className="py-2 px-3 text-right font-semibold text-terracota-600">{formatCurrency(parseFloat(item.costo_estimado))}</td>
                    <td className="py-2 px-3 text-right">{item.dias_uso}</td>
                    <td className="py-2 px-3 text-right">{parseFloat(item.promedio_diario).toFixed(3)} {item.unidad_medida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proveedores detalle */}
      {proveedores && proveedores.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Detalle por Proveedor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cafe-200">
                  <th className="text-left py-2 px-3 text-cafe-700">Proveedor</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Órdenes</th>
                  <th className="text-right py-2 px-3 text-cafe-700">Monto Total</th>
                  <th className="text-left py-2 px-3 text-cafe-700">Primera Orden</th>
                  <th className="text-left py-2 px-3 text-cafe-700">Última Orden</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov, i) => (
                  <tr key={i} className="border-b border-cafe-100">
                    <td className="py-2 px-3 font-medium">{prov.proveedor}</td>
                    <td className="py-2 px-3 text-right">{prov.total_ordenes}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(parseFloat(prov.monto_total))}</td>
                    <td className="py-2 px-3 text-xs text-cafe-500">{new Date(prov.primera_orden).toLocaleDateString('es-PE')}</td>
                    <td className="py-2 px-3 text-xs text-cafe-500">{new Date(prov.ultima_orden).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminReportes() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [periodo, setPeriodo] = useState('semana');
  const [fechaInicio, setFechaInicio] = useState(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reporteData, setReporteData] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState({});
  const [facturacionData, setFacturacionData] = useState(null);
  const [inventarioData, setInventarioData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    const hoy = new Date();

    switch (nuevoPeriodo) {
      case 'hoy':
        setFechaInicio(format(hoy, 'yyyy-MM-dd'));
        setFechaFin(format(hoy, 'yyyy-MM-dd'));
        break;
      case 'semana':
        setFechaInicio(format(subDays(hoy, 7), 'yyyy-MM-dd'));
        setFechaFin(format(hoy, 'yyyy-MM-dd'));
        break;
      case 'mes':
        setFechaInicio(format(startOfMonth(hoy), 'yyyy-MM-dd'));
        setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
  };

  const fetchAdvancedMetrics = async () => {
    try {
      setIsLoading(true);
      const metrics = {};

      // Ventas por hora
      try {
        const ventasHora = await api.get('/reportes/ventas/hora', {
          params: { fecha: fechaFin }
        });
        metrics.ventasHora = ventasHora.data.data;
      } catch (error) {
        console.warn('Error cargando ventas por hora:', error);
      }

      // Ventas por día de semana
      try {
        const ventasDiaSemana = await api.get('/reportes/ventas/dia-semana', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.ventasDiaSemana = ventasDiaSemana.data.data;
      } catch (error) {
        console.warn('Error cargando ventas por día semana:', error);
      }

      // Ventas por tipo de servicio
      try {
        console.log('Intentando cargar ventas por tipo de servicio...');
        const ventasTipoServicio = await api.get('/reportes/ventas/tipo-servicio', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        console.log('Datos de ventas por tipo de servicio:', ventasTipoServicio.data.data);
        // Convertir strings a números para el gráfico
        metrics.ventasTipoServicio = (ventasTipoServicio.data.data || []).map(item => ({
          ...item,
          total_ventas: parseFloat(item.total_ventas) || 0,
          total_pedidos: parseInt(item.total_pedidos) || 0,
          ticket_promedio: parseFloat(item.ticket_promedio) || 0,
          mesas_utilizadas: parseInt(item.mesas_utilizadas) || 0
        }));
      } catch (error) {
        console.warn('Error cargando ventas por tipo servicio:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
      }

      // Comparativa de ventas
      try {
        const comparativa = await api.get('/reportes/ventas/comparativa', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo: 'semana' }
        });
        metrics.comparativaVentas = comparativa.data.data;
      } catch (error) {
        console.warn('Error cargando comparativa ventas:', error);
      }

      // Tasa de crecimiento
      try {
        const crecimiento = await api.get('/reportes/ventas/crecimiento', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo: 'mensual' }
        });
        metrics.tasaCrecimiento = crecimiento.data.data;
      } catch (error) {
        console.warn('Error cargando tasa crecimiento:', error);
      }

      // Pedidos por mesero
      try {
        const pedidosMesero = await api.get('/reportes/pedidos/mesero', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.pedidosMesero = pedidosMesero.data.data;
      } catch (error) {
        console.warn('Error cargando pedidos por mesero:', error);
      }

      // Ticket promedio por tipo
      try {
        const ticketTipo = await api.get('/reportes/tickets/tipo-servicio', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.ticketTipoServicio = ticketTipo.data.data;
      } catch (error) {
        console.warn('Error cargando ticket por tipo:', error);
      }

      // Ticket promedio por día semana
      try {
        const ticketDiaSemana = await api.get('/reportes/tickets/dia-semana', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.ticketDiaSemana = ticketDiaSemana.data.data;
      } catch (error) {
        console.warn('Error cargando ticket por día semana:', error);
      }

      // Distribución de tickets
      try {
        const distribucionTickets = await api.get('/reportes/tickets/distribucion', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.distribucionTickets = distribucionTickets.data.data;
      } catch (error) {
        console.warn('Error cargando distribución tickets:', error);
      }

      // Análisis ABC
      try {
        const analisisABC = await api.get('/reportes/productos/abc', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.analisisABC = analisisABC.data.data;
      } catch (error) {
        console.warn('Error cargando análisis ABC:', error);
      }

      // Velocidad de venta productos
      try {
        const velocidadProductos = await api.get('/reportes/productos/velocidad', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.velocidadProductos = velocidadProductos.data.data;
      } catch (error) {
        console.warn('Error cargando velocidad productos:', error);
      }

      // Eficiencia meseros
      try {
        const eficienciaMeseros = await api.get('/reportes/personal/meseros', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.eficienciaMeseros = eficienciaMeseros.data.data;
      } catch (error) {
        console.warn('Error cargando eficiencia meseros:', error);
      }

      // Flujo de caja
      try {
        const flujoCaja = await api.get('/reportes/caja/flujo', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.flujoCaja = flujoCaja.data.data;
      } catch (error) {
        console.warn('Error cargando flujo caja:', error);
      }

      // Comisiones por método
      try {
        const comisionesMetodo = await api.get('/reportes/pagos/comisiones', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        metrics.comisionesMetodo = comisionesMetodo.data.data;
      } catch (error) {
        console.warn('Error cargando comisiones por método:', error);
      }

      setAdvancedMetrics(metrics);
    } catch (error) {
      console.error('Error cargando métricas avanzadas:', error);
      toast.error('Error al cargar algunas métricas avanzadas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReporte = async () => {
    try {
      setIsLoading(true);

      // Cargar reporte básico
      const response = await api.get('/reportes/ventas', {
        params: { desde: fechaInicio, hasta: fechaFin },
      });

      const data = response.data.data;

      // Mapear y convertir datos para el frontend
      const mappedData = {
        // Resumen - convertir strings a números
        ventasTotales: parseFloat(data.resumen?.total_ventas) || 0,
        totalPedidos: parseInt(data.resumen?.total_pedidos) || 0,
        ticketPromedio: parseFloat(data.resumen?.ticket_promedio) || 0,
        tiempoPromedio: 0, // No viene en el response actual

        // Ventas por día - mapear campos
        ventasPorDia: (data.ventasDiarias || []).map(d => ({
          fecha: new Date(d.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
          total: parseFloat(d.total_ventas) || 0,
          pedidos: parseInt(d.total_pedidos) || 0
        })),

        // Top productos - convertir cantidad a número
        topProductos: (data.topProductos || []).map(p => ({
          ...p,
          cantidad: parseInt(p.cantidad_vendida) || 0,
          total: parseFloat(p.total_ventas) || 0
        })),

        // Ventas por método de pago - mapear para el PieChart
        ventasPorMetodo: (data.ventasPorMetodoPago || []).map(m => ({
          name: m.metodo === 'efectivo' ? 'Efectivo' :
                m.metodo === 'tarjeta_credito' ? 'T. Crédito' :
                m.metodo === 'tarjeta_debito' ? 'T. Débito' :
                m.metodo === 'transferencia' ? 'Transferencia' : m.metodo,
          total: parseFloat(m.total) || 0,
          transacciones: parseInt(m.cantidad_transacciones) || 0
        })),

        // Datos adicionales
        ventasPorCategoria: data.ventasPorCategoria || [],
        ventasPorMesero: data.ventasPorMesero || []
      };

      console.log('Datos mapeados:', mappedData);
      setReporteData(mappedData);

      // Cargar métricas avanzadas
      await fetchAdvancedMetrics();

      // Cargar datos de facturación
      try {
        const [resumenRes, comprobantesRes] = await Promise.all([
          api.get('/reportes/facturacion/resumen', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
          api.get('/reportes/facturacion/comprobantes', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
        ]);
        setFacturacionData({
          ...resumenRes.data.data,
          comprobantes: comprobantesRes.data.data || [],
        });
      } catch (err) {
        console.warn('Error cargando datos facturación:', err);
        setFacturacionData(null);
      }

      // Cargar reportes de inventario
      try {
        const [valorizacionRes, movimientosRes, consumoTopRes, proveedoresRes] = await Promise.all([
          api.get('/inventario/reportes/valorizacion'),
          api.get('/inventario/reportes/movimientos', { params: { fecha_desde: fechaInicio, fecha_hasta: fechaFin } }),
          api.get('/inventario/reportes/consumo-top', { params: { dias: 30 } }),
          api.get('/inventario/reportes/proveedores', { params: { fecha_desde: fechaInicio, fecha_hasta: fechaFin } }),
        ]);
        setInventarioData({
          valorizacion: valorizacionRes.data.data,
          movimientos: movimientosRes.data.data,
          consumoTop: consumoTopRes.data.data,
          proveedores: proveedoresRes.data.data,
        });
      } catch (err) {
        console.warn('Error cargando datos inventario:', err);
        setInventarioData(null);
      }

    } catch (error) {
      console.error('Error al cargar reporte:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async () => {
    try {
      const response = await api.get('/reportes/ventas/export', {
        params: { desde: fechaInicio, hasta: fechaFin },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reporte_${fechaInicio}_${fechaFin}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Reporte exportado');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: FiBarChart2 },
    { id: 'ventas', label: 'Análisis de Ventas', icon: FiTrendingUp },
    { id: 'productos', label: 'Productos', icon: FiShoppingBag },
    { id: 'personal', label: 'Personal', icon: FiUsers },
    { id: 'financiero', label: 'Financiero', icon: FiDollarSign },
    { id: 'operacional', label: 'Operacional', icon: FiActivity },
    { id: 'facturacion', label: 'Facturación', icon: FiFileText },
    { id: 'inventario', label: 'Inventario', icon: FiBox },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Reportes Avanzados</h2>
          <p className="text-cafe-500">Análisis completo de ventas y operaciones</p>
        </div>

        <button
          onClick={handleExportar}
          className="btn-secondary flex items-center gap-2"
        >
          <FiDownload className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Pestañas */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-oliva-400 text-white'
                    : 'text-cafe-600 hover:bg-beige-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Periodos rápidos */}
          <div className="flex items-center gap-2 bg-beige-200 p-1 rounded-button">
            {[
              { value: 'hoy', label: 'Hoy' },
              { value: 'semana', label: '7 días' },
              { value: 'mes', label: 'Este mes' },
              { value: 'custom', label: 'Personalizado' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodoChange(option.value)}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                  periodo === option.value
                    ? 'bg-oliva-400 text-white'
                    : 'text-cafe-600 hover:bg-beige-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPeriodo('custom');
                }}
                className="input pl-10"
              />
            </div>
            <span className="text-cafe-500">a</span>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPeriodo('custom');
                }}
                className="input pl-10"
              />
            </div>
          </div>

          <button onClick={fetchReporte} className="btn-primary">
            Generar Reporte
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : activeTab === 'resumen' && reporteData ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Ventas Totales</p>
                  <p className="text-2xl font-bold text-cafe-800">
                    {formatCurrency(reporteData.ventasTotales || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  <FiDollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Pedidos</p>
                  <p className="text-2xl font-bold text-cafe-800">
                    {reporteData.totalPedidos || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <FiShoppingBag className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-cafe-800">
                    {formatCurrency(reporteData.ticketPromedio || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cafe-500">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-cafe-800">
                    {reporteData.tiempoPromedio || 0} min
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                  <FiClock className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6 mb-6">
            {/* Ventas por día */}
            <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-4">Ventas por Día</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reporteData.ventasPorDia || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                    <XAxis dataKey="fecha" stroke="#7F6A5F" />
                    <YAxis stroke="#7F6A5F" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E8E6C8',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [formatCurrency(value), 'Ventas']}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#2D5F3D"
                      fill="#2D5F3D"
                      fillOpacity={0.7}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ventas por método de pago */}
            <div className="card">
              <h3 className="font-semibold text-cafe-800 mb-4">
                Métodos de Pago
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reporteData.ventasPorMetodo || []}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="name"
                    >
                      {(reporteData.ventasPorMetodo || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Total']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E8E6C8',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top productos */}
          <div className="card">
            <h3 className="font-semibold text-cafe-800 mb-4">
              Productos Más Vendidos
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reporteData.topProductos || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis type="number" stroke="#7F6A5F" />
                  <YAxis
                    dataKey="nombre"
                    type="category"
                    width={120}
                    stroke="#7F6A5F"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [value, name === 'cantidad' ? 'Cantidad' : name]}
                  />
                  <Bar dataKey="cantidad" fill="#8B4513" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : activeTab === 'ventas' ? (
        <VentasTab data={advancedMetrics} />
      ) : activeTab === 'productos' ? (
        <ProductosTab data={advancedMetrics} />
      ) : activeTab === 'personal' ? (
        <PersonalTab data={advancedMetrics} />
      ) : activeTab === 'financiero' ? (
        <FinancieroTab data={advancedMetrics} />
      ) : activeTab === 'operacional' ? (
        <OperacionalTab data={advancedMetrics} />
      ) : activeTab === 'facturacion' ? (
        <FacturacionTab data={facturacionData} />
      ) : activeTab === 'inventario' ? (
        <InventarioTab data={inventarioData} />
      ) : (
        <div className="card text-center py-12">
          <p className="text-cafe-500 mb-2">Seleccione un periodo</p>
          <p className="text-cafe-400 text-sm">
            y presione "Generar Reporte" para ver los datos
          </p>
        </div>
      )}
    </div>
  );
}
