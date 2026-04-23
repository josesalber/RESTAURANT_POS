import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@services/api';
import { setMonedaConfig } from '@utils/format';

export const useConfigStore = create(
  persist(
    (set, get) => ({
      config: {
        nombreRestaurante: 'Restaurant POS',
        direccion: '',
        telefono: '',
        rfc: '',
        iva: 18,
        moneda: 'PEN',
        formatoMoneda: 'es-PE',
        tiempoAlertaCocina: 15,
        tiempoMaximoPreparacion: 30,
        propinaSugerida: 10,
        imprimirTicketAutomatico: false,
        imprimirComandaAutomatico: false,
        copiasCocina: 1,
        notificarPedidosNuevos: true,
        notificarPedidosListos: true,
        sonidoNotificaciones: true,
        // Facturación electrónica SUNAT
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
      },
      isLoaded: false,

      // Cargar configuración del servidor
      loadConfig: async () => {
        try {
          const response = await api.get('/configuracion');
          if (response.data.data) {
            set({ config: response.data.data, isLoaded: true });
            
            // Actualizar formato de moneda
            setMonedaConfig(
              response.data.data.moneda,
              response.data.data.formatoMoneda
            );
          }
        } catch (error) {
          console.error('Error loading config:', error);
          // Usar valores por defecto
          set({ isLoaded: true });
          setMonedaConfig('PEN', 'es-PE');
        }
      },

      // Actualizar configuración localmente
      updateConfig: (newConfig) => {
        set({ config: { ...get().config, ...newConfig } });
        
        // Actualizar formato de moneda si cambió
        if (newConfig.moneda || newConfig.formatoMoneda) {
          setMonedaConfig(
            newConfig.moneda || get().config.moneda,
            newConfig.formatoMoneda || get().config.formatoMoneda
          );
        }
      },

      // Obtener valor específico
      getValue: (key, defaultValue = null) => {
        return get().config[key] ?? defaultValue;
      },
    }),
    {
      name: 'config-storage',
      partializ: (state) => ({ config: state.config }),
    }
  )
);
