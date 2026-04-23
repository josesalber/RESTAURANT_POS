import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date, formatStr = 'dd/MM/yyyy') {
  if (!date) return '';
  return format(new Date(date), formatStr, { locale: es });
}

export function formatDateTime(date) {
  if (!date) return '';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatTime(date) {
  if (!date) return '';
  return format(new Date(date), 'HH:mm', { locale: es });
}

export function formatRelativeTime(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatSmartDate(date) {
  if (!date) return '';
  const d = new Date(date);

  if (isToday(d)) {
    return `Hoy ${format(d, 'HH:mm')}`;
  }

  if (isYesterday(d)) {
    return `Ayer ${format(d, 'HH:mm')}`;
  }

  return formatDateTime(d);
}

export function getElapsedMinutes(startTime) {
  if (!startTime) return 0;
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now - start) / 1000 / 60);
}

export function formatElapsedTime(startTime) {
  const minutes = getElapsedMinutes(startTime);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours}h ${mins}m`;
}
