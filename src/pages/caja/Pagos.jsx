import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePedidosStore } from '@store/pedidosStore';
import { useCajaStore } from '@store/cajaStore';
import { useConfigStore } from '@store/configStore';
import { formatCurrency } from '@utils/format';
import { handleApiError } from '@utils';
import api from '@services/api';
import {
  FiDollarSign,
  FiCreditCard,
  FiSmartphone,
  FiCheck,
  FiPrinter,
  FiArrowLeft,
  FiFileText,
  FiUser,
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function CajaPagos() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pedidoId = searchParams.get('pedido');

  const { fetchPedido, pedidoActual } = usePedidosStore();
  const { procesarPago, estadoCaja } = useCajaStore();
  const { config } = useConfigStore();

  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [propina, setPropina] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [cambio, setCambio] = useState(null);

  // Facturación electrónica
  const facturacionActiva = config.facturacionActiva === true || config.facturacionActiva === 'true';
  const [tipoComprobante, setTipoComprobante] = useState('03'); // 03=Boleta, 01=Factura
  const [numDocCliente, setNumDocCliente] = useState('');
  const [razonSocialCliente, setRazonSocialCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null);

  useEffect(() => {
    if (pedidoId) {
      fetchPedido(pedidoId);
    }
  }, [pedidoId]);

  const total = parseFloat(pedidoActual?.total || 0);
  const totalConPropina = total + parseFloat(propina || 0);
  const montoPagadoNum = parseFloat(montoPagado || 0);

  useEffect(() => {
    if (metodoPago === 'efectivo' && montoPagadoNum > 0) {
      setCambio(Math.max(0, montoPagadoNum - totalConPropina));
    } else {
      setCambio(null);
    }
  }, [montoPagado, totalConPropina, metodoPago]);

  const handleProcesarPago = async () => {
    if (!pedidoActual) {
      toast.error('No hay pedido seleccionado');
      return;
    }

    if (metodoPago === 'efectivo' && montoPagadoNum < totalConPropina) {
      toast.error('El monto pagado es insuficiente');
      return;
    }

    // Validaciones de facturación
    if (facturacionActiva) {
      if (tipoComprobante === '01') {
        if (!numDocCliente || numDocCliente.length !== 11) {
          toast.error('Para Factura se requiere un RUC válido (11 dígitos)');
          return;
        }
        if (!razonSocialCliente.trim()) {
          toast.error('Para Factura se requiere la Razón Social');
          return;
        }
      }
      if (tipoComprobante === '03' && totalConPropina >= 700) {
        if (!numDocCliente || numDocCliente.length < 8) {
          toast.error('Para Boletas mayores a S/700 se requiere DNI o RUC');
          return;
        }
      }
    }

    setIsProcessing(true);

    try {
      const result = await procesarPago(
        pedidoActual.id,
        metodoPago,
        metodoPago === 'efectivo' ? montoPagadoNum : totalConPropina,
        parseFloat(propina || 0)
      );

      if (result.success) {
        // Emitir comprobante electrónico si la facturación está activa
        if (facturacionActiva && result.data?.pago?.id) {
          try {
            const docLen = (numDocCliente || '').length;
            const comprobanteData = {
              pago_id: result.data.pago.id,
              tipo_comprobante: tipoComprobante,
              tipo_documento_cliente: tipoComprobante === '01' ? '6' : (docLen === 11 ? '6' : docLen === 8 ? '1' : '0'),
              numero_documento_cliente: numDocCliente || '',
              razon_social_cliente: razonSocialCliente || (tipoComprobante === '03' ? 'CLIENTE VARIOS' : ''),
              email_cliente: emailCliente || '',
            };
            const compRes = await api.post('/facturacion', comprobanteData);
            if (compRes.data?.comprobante) {
              setComprobanteEmitido(compRes.data.comprobante);
            }
          } catch (compError) {
            console.error('Error al emitir comprobante:', compError);
            toast.error('Pago exitoso, pero hubo un error al generar el comprobante electrónico');
          }
        }

        setPagoExitoso(true);
        toast.success('¡Pago procesado exitosamente!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprimirTicket = () => {
    if (!pedidoActual) {
      toast.error('No hay datos del pedido');
      return;
    }

    const fechaActual = new Date().toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const items = pedidoActual.items || [];
    const subtotal = parseFloat(pedidoActual.subtotal || 0);
    const iva = items.reduce((total, item) => {
      const precioConIGV = parseFloat(item.precio || item.subtotal / item.cantidad);
      const precioSinIGV = parseFloat(item.precio_base || 0);
      return total + ((precioConIGV - precioSinIGV) * item.cantidad);
    }, 0);
    const propinaNum = parseFloat(propina || 0);
    const porcentajeIVA = config.iva || 18;

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket #${pedidoActual.numero_pedido || pedidoActual.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            padding: 10px;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .header p { font-size: 10px; }
          .info { margin: 10px 0; font-size: 11px; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .items { margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 60px; text-align: right; }
          .totals { margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-row.grand { font-size: 14px; font-weight: bold; margin-top: 5px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          @media print {
            body { width: 72mm; }
            @page { margin: 0; size: 72mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.nombreRestaurante || '🍽️ RESTAURANTE'}</h1>
          ${config.facturacionActiva && config.facturacionRazonSocial ? `<p style="font-weight:bold;">${config.facturacionRazonSocial}</p>` : ''}
          ${config.facturacionActiva && config.facturacionRuc ? `<p>RUC: ${config.facturacionRuc}</p>` : (config.rfc ? `<p>${config.rfc}</p>` : '')}
          ${config.facturacionActiva && config.facturacionDireccionFiscal ? `<p>${config.facturacionDireccionFiscal}</p>` : (config.direccion ? `<p>${config.direccion}</p>` : '')}
          ${config.facturacionActiva && config.facturacionDistrito ? `<p>${config.facturacionDistrito} - ${config.facturacionProvincia || ''} - ${config.facturacionDepartamento || ''}</p>` : ''}
          ${config.telefono ? `<p>Tel: ${config.telefono}</p>` : ''}
          <p>${fechaActual}</p>
          ${comprobanteEmitido ? `
            <div style="margin-top:8px; padding:6px; border:2px solid #000; font-size:13px; font-weight:bold;">
              <p>${comprobanteEmitido.tipo_comprobante === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}</p>
              <p style="font-size:15px; margin-top:3px;">${comprobanteEmitido.serie}-${String(comprobanteEmitido.correlativo).padStart(8, '0')}</p>
            </div>
          ` : '<p>TICKET DE VENTA</p>'}
        </div>
        
        <div class="info">
          <div class="info-row"><span>Ticket:</span><span>#${pedidoActual.numero_pedido || pedidoActual.id}</span></div>
          <div class="info-row"><span>Tipo:</span><span>${pedidoActual.tipo === 'domicilio' ? 'DELIVERY' : 'MESA'}</span></div>
          <div class="info-row"><span>Mesa:</span><span>${pedidoActual.mesa_numero || 'N/A'}</span></div>
          <div class="info-row"><span>Mesero:</span><span>${pedidoActual.mesero_nombre || 'N/A'}</span></div>
          <div class="info-row"><span>Método:</span><span>${metodoPago.toUpperCase()}</span></div>
        </div>
        
        ${comprobanteEmitido ? `
        <div class="info" style="border:1px solid #ccc; padding:5px; margin:8px 0;">
          <div class="info-row"><span>Cliente:</span><span>${comprobanteEmitido.razon_social_cliente || 'CLIENTE VARIOS'}</span></div>
          ${comprobanteEmitido.numero_documento_cliente ? `<div class="info-row"><span>${comprobanteEmitido.tipo_documento_cliente === '6' ? 'RUC' : 'DNI'}:</span><span>${comprobanteEmitido.numero_documento_cliente}</span></div>` : ''}
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="items">
          <div class="item" style="font-weight: bold;">
            <span class="item-name">PRODUCTO</span>
            <span class="item-qty">CANT</span>
            <span class="item-price">PRECIO</span>
          </div>
          ${items.map(item => {
            const precioUnitario = parseFloat(item.precio || item.subtotal / item.cantidad);
            const precioSinIGV = parseFloat(item.precio_base || 0);
            return `
              <div class="item">
                <span class="item-name">${item.producto_nombre || item.nombre}</span>
                <span class="item-qty">${item.cantidad}</span>
                <span class="item-price">${formatCurrency(precioUnitario)}<br><small style="color: #666; font-size: 9px;">(${formatCurrency(precioSinIGV)} sin IGV)</small></span>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="total-row"><span>IVA (${porcentajeIVA}%):</span><span>${formatCurrency(iva)}</span></div>
          ${propinaNum > 0 ? `<div class="total-row"><span>Propina:</span><span>${formatCurrency(propinaNum)}</span></div>` : ''}
          <div class="total-row grand"><span>TOTAL:</span><span>${formatCurrency(totalConPropina)}</span></div>
          ${metodoPago === 'efectivo' && montoPagadoNum > 0 ? `
            <div class="total-row"><span>Pagado:</span><span>${formatCurrency(montoPagadoNum)}</span></div>
            <div class="total-row" style="font-weight: bold;"><span>Cambio:</span><span>${formatCurrency(cambio || 0)}</span></div>
          ` : ''}
        </div>
        
        <div class="footer">
          ${comprobanteEmitido ? `
            ${comprobanteEmitido.hash_cpe ? `<p style="font-size:8px; margin-bottom:4px;">Hash: ${comprobanteEmitido.hash_cpe}</p>` : ''}
            <p style="font-size:9px; margin-bottom:6px;">Representación impresa de la ${comprobanteEmitido.tipo_comprobante === '01' ? 'Factura' : 'Boleta de Venta'} Electrónica</p>
            ${comprobanteEmitido.estado === 'aceptado' || comprobanteEmitido.estado_sunat === 'aceptado' ? '<p style="font-size:9px;">✅ Aceptado por SUNAT</p>' : ''}
          ` : ''}
          <p>¡Gracias por su visita!</p>
          <p>Vuelva pronto</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      toast.success('Ticket generado');
    } else {
      toast.error('No se pudo abrir la ventana de impresión. Verifique los popups.');
    }
  };

  const handleNuevoPago = () => {
    navigate('/caja');
  };

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: FiDollarSign },
    { value: 'tarjeta', label: 'Tarjeta', icon: FiCreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: FiSmartphone },
  ];

  const montosRapidos = [50, 100, 200, 500, 1000];

  if (!estadoCaja?.abierta) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-bold text-cafe-800 mb-2">Caja Cerrada</h2>
        <p className="text-cafe-500">Debe abrir la caja para procesar pagos</p>
      </div>
    );
  }

  if (!pedidoId) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-bold text-cafe-800 mb-2">Sin pedido seleccionado</h2>
        <p className="text-cafe-500 mb-4">Seleccione un pedido desde la lista</p>
        <button onClick={() => navigate('/caja')} className="btn-primary">
          Ver pedidos
        </button>
      </div>
    );
  }

  // Vista de pago exitoso
  if (pagoExitoso) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center py-8">
          <div className="w-20 h-20 bg-estado-disponible/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-cafe-800 mb-2">¡Pago Exitoso!</h2>
          <p className="text-cafe-500 mb-6">
            El pedido #{pedidoActual?.numero_pedido} ha sido cobrado
          </p>

          <div className="bg-beige-100 rounded-button p-4 mb-6">
            <div className="flex justify-between text-cafe-600 mb-2">
              <span>Total cobrado</span>
              <span className="font-bold">{formatCurrency(totalConPropina)}</span>
            </div>
            {propina && parseFloat(propina) > 0 && (
              <div className="flex justify-between text-cafe-600 mb-2">
                <span>Propina incluida</span>
                <span>{formatCurrency(parseFloat(propina))}</span>
              </div>
            )}
            {cambio !== null && cambio > 0 && (
              <div className="flex justify-between text-green-600 font-bold text-lg pt-2 border-t border-beige-300">
                <span>Cambio</span>
                <span>{formatCurrency(cambio)}</span>
              </div>
            )}
            {comprobanteEmitido && (
              <div className="mt-3 pt-3 border-t border-beige-300">
                <div className="flex justify-between text-cafe-600 mb-1">
                  <span>Comprobante</span>
                  <span className="font-bold">
                    {comprobanteEmitido.serie}-{String(comprobanteEmitido.correlativo).padStart(8, '0')}
                  </span>
                </div>
                <div className="flex justify-between text-cafe-600 text-sm">
                  <span>Tipo</span>
                  <span>{comprobanteEmitido.tipo_comprobante === '01' ? 'Factura' : 'Boleta de Venta'}</span>
                </div>
                {comprobanteEmitido.estado_sunat && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-cafe-600">SUNAT</span>
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      comprobanteEmitido.estado_sunat === 'aceptado' ? 'bg-green-100 text-green-700' :
                      comprobanteEmitido.estado_sunat === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {comprobanteEmitido.estado_sunat.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImprimirTicket}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <FiPrinter className="w-5 h-5" />
              Imprimir
            </button>
            {comprobanteEmitido && (
              <button
                onClick={() => {
                  const w = window.open(`/api/facturacion/${comprobanteEmitido.id}/html`, '_blank', 'width=400,height=700');
                  if (!w) toast.error('Habilite popups para imprimir el comprobante');
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <FiFileText className="w-5 h-5" />
                Comprobante
              </button>
            )}
            <button
              onClick={handleNuevoPago}
              className="btn-primary flex-1"
            >
              Nuevo Cobro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/caja')}
          className="btn-touch bg-beige-200 rounded-button hover:bg-beige-300"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Procesar Pago</h2>
          <p className="text-cafe-500">
            Mesa {pedidoActual?.mesa_numero} - #{pedidoActual?.id}
          </p>
          <p className="text-sm text-cafe-400">
            Mesero: {pedidoActual?.mesero_nombre}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Resumen del pedido */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Resumen</h3>

          <div className="space-y-2 mb-4 max-h-48 overflow-auto">
            {pedidoActual?.items?.map((item, idx) => {
              const precioConIGV = parseFloat(item.precio_unitario) * item.cantidad;
              const precioSinIGV = parseFloat(item.precio_base || 0) * item.cantidad;
              return (
                <div key={idx} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-cafe-600">
                      {item.cantidad}x {item.producto_nombre}
                    </span>
                    <span className="text-cafe-800">
                      {formatCurrency(precioConIGV)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-cafe-500 ml-4">
                    <span>(sin IGV)</span>
                    <span>{formatCurrency(precioSinIGV)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-beige-200 pt-4">
            <div className="flex justify-between text-cafe-600 mb-2">
              <span>Subtotal sin IGV</span>
              <span>{formatCurrency(pedidoActual?.items?.reduce((total, item) => {
                return total + (parseFloat(item.precio_base || 0) * item.cantidad);
              }, 0) || 0)}</span>
            </div>
            <div className="flex justify-between text-cafe-600 mb-2">
              <span>IGV ({config.iva || 18}%)</span>
              <span>{formatCurrency(pedidoActual?.items?.reduce((total, item) => {
                const precioConIGV = parseFloat(item.precio_unitario) * item.cantidad;
                const precioSinIGV = parseFloat(item.precio_base || 0) * item.cantidad;
                return total + (precioConIGV - precioSinIGV);
              }, 0) || 0)}</span>
            </div>
            <div className="flex justify-between text-cafe-600 mb-2">
              <span>Propina</span>
              <span>{formatCurrency(parseFloat(propina || 0))}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-cafe-800 pt-2 border-t border-beige-200">
              <span>Total</span>
              <span>{formatCurrency(totalConPropina)}</span>
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Método de Pago</h3>

          {/* Selector de método */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {metodosPago.map((metodo) => (
              <button
                key={metodo.value}
                onClick={() => setMetodoPago(metodo.value)}
                className={clsx(
                  'p-3 rounded-button flex flex-col items-center gap-2 transition-colors',
                  metodoPago === metodo.value
                    ? 'bg-oliva-400 text-white'
                    : 'bg-beige-200 text-cafe-700 hover:bg-beige-300'
                )}
              >
                <metodo.icon className="w-6 h-6" />
                <span className="text-sm">{metodo.label}</span>
              </button>
            ))}
          </div>

          {/* Propina */}
          <div className="mb-4">
            <label className="label">Propina (opcional)</label>
            <input
              type="number"
              value={propina}
              onChange={(e) => setPropina(e.target.value)}
              placeholder="0.00"
              className="input"
              min="0"
              step="0.01"
            />
          </div>

          {/* Tipo de comprobante - solo si facturación activa */}
          {facturacionActiva && (
            <div className="mb-4 p-3 bg-beige-100 rounded-button">
              <label className="label flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setTipoComprobante('03');
                    setNumDocCliente('');
                    setRazonSocialCliente('');
                  }}
                  className={clsx(
                    'p-2 rounded-button text-sm font-medium transition-colors',
                    tipoComprobante === '03'
                      ? 'bg-oliva-400 text-white'
                      : 'bg-white text-cafe-700 hover:bg-beige-200'
                  )}
                >
                  Boleta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoComprobante('01');
                    setNumDocCliente('');
                    setRazonSocialCliente('');
                  }}
                  className={clsx(
                    'p-2 rounded-button text-sm font-medium transition-colors',
                    tipoComprobante === '01'
                      ? 'bg-oliva-400 text-white'
                      : 'bg-white text-cafe-700 hover:bg-beige-200'
                  )}
                >
                  Factura
                </button>
              </div>

              {/* Datos del cliente */}
              {tipoComprobante === '01' ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-cafe-600">RUC *</label>
                    <input
                      type="text"
                      value={numDocCliente}
                      onChange={(e) => setNumDocCliente(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="20XXXXXXXXX"
                      className="input text-sm"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cafe-600">Razón Social *</label>
                    <input
                      type="text"
                      value={razonSocialCliente}
                      onChange={(e) => setRazonSocialCliente(e.target.value)}
                      placeholder="Razón social del cliente"
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cafe-600">Email (opcional)</label>
                    <input
                      type="email"
                      value={emailCliente}
                      onChange={(e) => setEmailCliente(e.target.value)}
                      placeholder="cliente@empresa.com"
                      className="input text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-cafe-600">
                      DNI / RUC {totalConPropina >= 700 ? '*' : '(opcional)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-cafe-400" />
                      <input
                        type="text"
                        value={numDocCliente}
                        onChange={(e) => setNumDocCliente(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder={totalConPropina >= 700 ? 'Requerido por monto' : 'Opcional'}
                        className="input text-sm flex-1"
                        maxLength={11}
                      />
                    </div>
                  </div>
                  {numDocCliente && (
                    <div>
                      <label className="text-xs text-cafe-600">Nombre / Razón Social</label>
                      <input
                        type="text"
                        value={razonSocialCliente}
                        onChange={(e) => setRazonSocialCliente(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="input text-sm"
                      />
                    </div>
                  )}
                  {totalConPropina >= 700 && !numDocCliente && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      ⚠️ Obligatorio para montos ≥ S/700.00
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Monto pagado (solo para efectivo) */}
          {metodoPago === 'efectivo' && (
            <div className="mb-4">
              <label className="label">Monto Pagado</label>
              <input
                type="number"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                placeholder={totalConPropina.toFixed(2)}
                className="input text-xl font-bold"
                min="0"
                step="0.01"
              />

              {/* Montos rápidos */}
              <div className="flex flex-wrap gap-2 mt-2">
                {montosRapidos.map((monto) => (
                  <button
                    key={monto}
                    onClick={() => setMontoPagado(monto.toString())}
                    className="px-3 py-1 bg-beige-200 text-cafe-700 rounded-button text-sm hover:bg-beige-300"
                  >
                    ${monto}
                  </button>
                ))}
                <button
                  onClick={() => setMontoPagado(totalConPropina.toFixed(2))}
                  className="px-3 py-1 bg-oliva-100 text-oliva-700 rounded-button text-sm hover:bg-oliva-200"
                >
                  Exacto
                </button>
              </div>

              {/* Cambio */}
              {cambio !== null && cambio > 0 && (
                <div className="mt-4 p-3 bg-green-100 rounded-button">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Cambio:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(cambio)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botón de procesar */}
          <button
            onClick={handleProcesarPago}
            disabled={isProcessing || (metodoPago === 'efectivo' && montoPagadoNum < totalConPropina)}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FiCheck className="w-5 h-5" />
                Confirmar Pago {formatCurrency(totalConPropina)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
