import { useState, useEffect } from 'react';
import api from '@services/api';
import {
  FiSave,
  FiGlobe,
  FiDollarSign,
  FiPrinter,
  FiBell,
  FiDatabase,
  FiFileText,
  FiShield,
  FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminConfiguraciones() {
  
  const [config, setConfig] = useState({
    // Información del restaurante
    nombreRestaurante: '',
    direccion: '',
    telefono: '',
    rfc: '',
    
    // Configuración fiscal
    iva: 18,
    moneda: 'PEN',
    formatoMoneda: 'es-PE',

    // Configuración de operación
    tiempoAlertaCocina: 15,
    tiempoMaximoPreparacion: 30,
    propinaSugerida: 15,
    
    // Impresión
    imprimirTicketAutomatico: true,
    imprimirComandaAutomatico: true,
    copiasCocina: 1,
    
    // Notificaciones
    notificarPedidosNuevos: true,
    notificarPedidosListos: true,
    sonidoNotificaciones: true,

    // Facturación Electrónica SUNAT (Solo Perú)
    facturacionActiva: false,
    facturacionModo: 'beta',
    facturacionRuc: '',
    facturacionRazonSocial: '',
    facturacionNombreComercial: '',
    facturacionDireccionFiscal: '',
    facturacionUbigeo: '',
    facturacionDepartamento: '',
    facturacionProvincia: '',
    facturacionDistrito: '',
    facturacionUsuarioSol: '',
    facturacionClaveSol: '',
    facturacionApiToken: '',
    facturacionApiUrl: '',
    facturacionTipoEnvio: 'api',
    facturacionSerieBoleta: 'B001',
    facturacionSerieFactura: 'F001',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Cargar configuraciones generales
      const response = await api.get('/configuracion');
      if (response.data.data) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/configuracion', config);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Configuraciones</h2>
          <p className="text-cafe-500">Ajustes generales del sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
          {/* Información del restaurante */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-oliva-100">
                <FiGlobe className="w-5 h-5 text-oliva-600" />
              </div>
              <h3 className="font-semibold text-cafe-800">
                Información del Restaurante
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Nombre del Restaurante
                </label>
                <input
                  type="text"
                  value={config.nombreRestaurante}
                  onChange={(e) =>
                    handleChange('nombreRestaurante', e.target.value)
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={config.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={config.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  value={config.rfc}
                  onChange={(e) => handleChange('rfc', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Configuración fiscal */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-terracota-100">
                <FiDollarSign className="w-5 h-5 text-terracota-600" />
              </div>
              <h3 className="font-semibold text-cafe-800">
                Configuración Fiscal
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  IVA (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.iva}
                  onChange={(e) =>
                    handleChange('iva', parseFloat(e.target.value))
                  }
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Moneda
                </label>
                <select
                  value={config.moneda}
                  onChange={(e) => handleChange('moneda', e.target.value)}
                  className="input w-full"
                >
                  <option value="PEN">Sol Peruano (PEN)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Propina Sugerida (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={config.propinaSugerida}
                  onChange={(e) =>
                    handleChange('propinaSugerida', parseFloat(e.target.value))
                  }
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Configuración de operación */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                <FiDatabase className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-cafe-800">
                Tiempos de Operación
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Alerta Cocina (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.tiempoAlertaCocina}
                  onChange={(e) =>
                    handleChange('tiempoAlertaCocina', parseInt(e.target.value))
                  }
                  className="input w-full"
                />
                <p className="text-xs text-cafe-400 mt-1">
                  Tiempo antes de mostrar alerta de demora
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Tiempo Máximo Preparación (minutos)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={config.tiempoMaximoPreparacion}
                  onChange={(e) =>
                    handleChange(
                      'tiempoMaximoPreparacion',
                      parseInt(e.target.value)
                    )
                  }
                  className="input w-full"
                />
                <p className="text-xs text-cafe-400 mt-1">
                  Tiempo para marcar pedido como crítico
                </p>
              </div>
            </div>
          </div>

          {/* Impresión */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                <FiPrinter className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-cafe-800">Impresión</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.imprimirTicketAutomatico}
                  onChange={(e) =>
                    handleChange('imprimirTicketAutomatico', e.target.checked)
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">
                  Imprimir ticket automáticamente al pagar
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.imprimirComandaAutomatico}
                  onChange={(e) =>
                    handleChange('imprimirComandaAutomatico', e.target.checked)
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">
                  Imprimir comanda automáticamente
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Copias para Cocina
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.copiasCocina}
                  onChange={(e) =>
                    handleChange('copiasCocina', parseInt(e.target.value))
                  }
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="card desktop:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">
                <FiBell className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-cafe-800">Notificaciones</h3>
            </div>

            <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notificarPedidosNuevos}
                  onChange={(e) =>
                    handleChange('notificarPedidosNuevos', e.target.checked)
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">Notificar pedidos nuevos</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notificarPedidosListos}
                  onChange={(e) =>
                    handleChange('notificarPedidosListos', e.target.checked)
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">Notificar pedidos listos</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.sonidoNotificaciones}
                  onChange={(e) =>
                    handleChange('sonidoNotificaciones', e.target.checked)
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">Sonido de notificaciones</span>
              </label>
            </div>
          </div>
        </div>

        {/* ─── Facturación Electrónica SUNAT ─── */}
        <div className="card desktop:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
              <FiFileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-cafe-800">
                Facturación Electrónica SUNAT
              </h3>
              <p className="text-xs text-cafe-400">Solo para Perú — Boletas y Facturas electrónicas</p>
            </div>
          </div>

          {/* Switch activar */}
          <div className="mb-6 p-4 bg-beige-50 rounded-xl border border-beige-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.facturacionActiva}
                onChange={(e) => handleChange('facturacionActiva', e.target.checked)}
                className="w-5 h-5 text-red-500 rounded focus:ring-red-400"
              />
              <div>
                <span className="text-cafe-700 font-semibold">Activar Facturación Electrónica</span>
                <p className="text-xs text-cafe-400 mt-0.5">
                  Habilita la emisión de Boletas y Facturas electrónicas ante SUNAT. Requiere RUC y credenciales.
                </p>
              </div>
            </label>
          </div>

          {config.facturacionActiva && (
            <div className="space-y-6">
              {/* Modo */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Modo de Operación</label>
                  <select
                    value={config.facturacionModo}
                    onChange={(e) => handleChange('facturacionModo', e.target.value)}
                    className="input w-full"
                  >
                    <option value="beta">Beta (Pruebas SUNAT)</option>
                    <option value="produccion">Producción (Emisión Real)</option>
                  </select>
                  <p className="text-xs text-amber-600 mt-1">
                    {config.facturacionModo === 'beta' 
                      ? '⚠️ Modo pruebas: los comprobantes NO se registran ante SUNAT' 
                      : '✅ Modo producción: los comprobantes son válidos ante SUNAT'}
                  </p>
                </div>
              </div>

              {/* Datos del Emisor */}
              <div>
                <h4 className="text-sm font-semibold text-cafe-700 mb-3 flex items-center gap-2">
                  <FiShield className="w-4 h-4" /> Datos del Emisor
                </h4>
                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">RUC *</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={config.facturacionRuc}
                      onChange={(e) => handleChange('facturacionRuc', e.target.value.replace(/\D/g, ''))}
                      className="input w-full"
                      placeholder="20XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">Razón Social *</label>
                    <input
                      type="text"
                      value={config.facturacionRazonSocial}
                      onChange={(e) => handleChange('facturacionRazonSocial', e.target.value)}
                      className="input w-full"
                      placeholder="MI RESTAURANTE S.A.C."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">Nombre Comercial</label>
                    <input
                      type="text"
                      value={config.facturacionNombreComercial}
                      onChange={(e) => handleChange('facturacionNombreComercial', e.target.value)}
                      className="input w-full"
                      placeholder="Mi Restaurante"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">Dirección Fiscal *</label>
                    <input
                      type="text"
                      value={config.facturacionDireccionFiscal}
                      onChange={(e) => handleChange('facturacionDireccionFiscal', e.target.value)}
                      className="input w-full"
                      placeholder="Av. Principal 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">Ubigeo (6 dígitos)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={config.facturacionUbigeo}
                      onChange={(e) => handleChange('facturacionUbigeo', e.target.value.replace(/\D/g, ''))}
                      className="input w-full"
                      placeholder="150101"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-cafe-700 mb-1">Depto.</label>
                      <input
                        type="text"
                        value={config.facturacionDepartamento}
                        onChange={(e) => handleChange('facturacionDepartamento', e.target.value)}
                        className="input w-full"
                        placeholder="Lima"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cafe-700 mb-1">Provincia</label>
                      <input
                        type="text"
                        value={config.facturacionProvincia}
                        onChange={(e) => handleChange('facturacionProvincia', e.target.value)}
                        className="input w-full"
                        placeholder="Lima"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cafe-700 mb-1">Distrito</label>
                      <input
                        type="text"
                        value={config.facturacionDistrito}
                        onChange={(e) => handleChange('facturacionDistrito', e.target.value)}
                        className="input w-full"
                        placeholder="Miraflores"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conexión con SUNAT */}
              <div>
                <h4 className="text-sm font-semibold text-cafe-700 mb-3 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4" /> Conexión con SUNAT / Proveedor
                </h4>
                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">Tipo de Envío</label>
                    <select
                      value={config.facturacionTipoEnvio}
                      onChange={(e) => handleChange('facturacionTipoEnvio', e.target.value)}
                      className="input w-full"
                    >
                      <option value="api">API Proveedor (Nubefact, etc.)</option>
                      <option value="directo">Directo a SUNAT (requiere certificado)</option>
                    </select>
                  </div>

                  {config.facturacionTipoEnvio === 'api' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-cafe-700 mb-1">URL del API *</label>
                        <input
                          type="url"
                          value={config.facturacionApiUrl}
                          onChange={(e) => handleChange('facturacionApiUrl', e.target.value)}
                          className="input w-full"
                          placeholder="https://api.nubefact.com/api/v1"
                        />
                      </div>
                      <div className="tablet:col-span-2">
                        <label className="block text-sm font-medium text-cafe-700 mb-1">Token API *</label>
                        <input
                          type="password"
                          value={config.facturacionApiToken}
                          onChange={(e) => handleChange('facturacionApiToken', e.target.value)}
                          className="input w-full"
                          placeholder="Token proporcionado por el proveedor"
                        />
                        <p className="text-xs text-cafe-400 mt-1">
                          Obtenga su token en el panel de su proveedor de facturación (Nubefact, Efact, etc.)
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-cafe-700 mb-1">Usuario SOL *</label>
                        <input
                          type="text"
                          value={config.facturacionUsuarioSol}
                          onChange={(e) => handleChange('facturacionUsuarioSol', e.target.value)}
                          className="input w-full"
                          placeholder="MODDATOS"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cafe-700 mb-1">Clave SOL *</label>
                        <input
                          type="password"
                          value={config.facturacionClaveSol}
                          onChange={(e) => handleChange('facturacionClaveSol', e.target.value)}
                          className="input w-full"
                          placeholder="moddatos"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Series de comprobantes */}
                <div className="mt-4 pt-4 border-t border-beige-200">
                  <h5 className="text-sm font-semibold text-cafe-700 mb-3">Series de Comprobantes</h5>
                  <p className="text-xs text-cafe-400 mb-3">
                    Estas series deben coincidir con las configuradas en su proveedor (Nubefact). 
                    Consulte su panel de Nubefact para ver las series asignadas.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-cafe-700 mb-1">Serie Boleta</label>
                      <input
                        type="text"
                        value={config.facturacionSerieBoleta}
                        onChange={(e) => handleChange('facturacionSerieBoleta', e.target.value.toUpperCase().slice(0, 4))}
                        className="input w-full font-mono"
                        placeholder="B001"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cafe-700 mb-1">Serie Factura</label>
                      <input
                        type="text"
                        value={config.facturacionSerieFactura}
                        onChange={(e) => handleChange('facturacionSerieFactura', e.target.value.toUpperCase().slice(0, 4))}
                        className="input w-full font-mono"
                        placeholder="F001"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <FiSave className="w-5 h-5" />
            )}
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
