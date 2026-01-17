export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return '—';
}
