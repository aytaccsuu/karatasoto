export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  nakit: 'Nakit',
  kredi_karti: 'Kredi Kartı',
  veresiye: 'Veresiye',
  eft_havale: 'EFT/Havale',
};

export const PAYMENT_TYPE_COLORS: Record<string, string> = {
  nakit: '#16a34a',
  kredi_karti: '#2563eb',
  veresiye: '#dc2626',
  eft_havale: '#7c3aed',
};
