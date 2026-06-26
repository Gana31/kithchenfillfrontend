export function parseDecimalInput(input: string): number {
  const normalized = input.trim().replace(/,/g, '');
  if (!normalized || normalized === '.') return NaN;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return '₹0';

  const abs = Math.abs(value);
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.round(rounded);
  const hasPaise = Math.abs(rounded - whole) >= 0.005;
  const isSmallRate = abs > 0 && abs < 1;

  if (hasPaise || isSmallRate) {
    const fractionDigits = abs > 0 && abs < 0.01 ? 4 : 2;
    return `₹${rounded.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: fractionDigits,
    })}`;
  }

  return `₹${whole.toLocaleString('en-IN')}`;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

export function trendEndDateFromSelected(selectedDate: string): string {
  return selectedDate;
}

export function trendStartDateFromSelected(selectedDate: string, days = 6): string {
  return shiftDateKey(selectedDate, -days);
}
