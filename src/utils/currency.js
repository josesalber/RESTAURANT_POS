export function formatCurrency(amount, currency = 'PEN') {
  if (amount === null || amount === undefined) return 'S/. 0.00';

  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined) return '0';

  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';

  return `${formatNumber(value, decimals)}%`;
}

export function parseCurrency(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const cleaned = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

export function calculateTax(subtotal, taxRate = 16) {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal, taxRate = 16) {
  return subtotal + calculateTax(subtotal, taxRate);
}

export function calculateDiscount(amount, discountPercent) {
  return amount * (discountPercent / 100);
}

export function calculateTip(amount, tipPercent) {
  return amount * (tipPercent / 100);
}
