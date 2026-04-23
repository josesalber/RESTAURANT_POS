export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  PREPARANDO: 'preparando',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
};

export const ESTADOS_MESA = {
  DISPONIBLE: 'disponible',
  OCUPADA: 'ocupada',
  RESERVADA: 'reservada',
  POR_LIMPIAR: 'por-limpiar',
  CUENTA: 'cuenta',
};

export const ROLES = {
  ADMIN: 'admin',
  MESERO: 'mesero',
  COCINA: 'cocina',
  CAJA: 'caja',
};

export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta',
  MIXTO: 'mixto',
};

export const TIPOS_MOVIMIENTO = {
  INGRESO: 'ingreso',
  EGRESO: 'egreso',
  APERTURA: 'apertura',
  CIERRE: 'cierre',
};

export const ZONAS_MESA = [
  { value: 'interior', label: 'Interior' },
  { value: 'terraza', label: 'Terraza' },
  { value: 'bar', label: 'Bar' },
  { value: 'privado', label: 'Privado' },
];

export const getEstadoPedidoLabel = (estado) => {
  const labels = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    listo: 'Listo',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[estado] || estado;
};

export const getEstadoMesaLabel = (estado) => {
  const labels = {
    disponible: 'Disponible',
    ocupada: 'Ocupada',
    reservada: 'Reservada',
    'por-limpiar': 'Por Limpiar',
  };
  return labels[estado] || estado;
};

export const getRolLabel = (rol) => {
  const labels = {
    admin: 'Administrador',
    mesero: 'Mesero',
    cocina: 'Cocina',
    caja: 'Caja',
  };
  return labels[rol] || rol;
};

export const getMetodoPagoLabel = (metodo) => {
  const labels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    mixto: 'Mixto',
  };
  return labels[metodo] || metodo;
};
