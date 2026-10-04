// Dates from the API are ISO days ("2026-11-12"); parse them as local dates so the
// day never shifts with the browser's time zone.
const toDate = (iso: string) => new Date(`${iso}T00:00:00`);

const dayMonthYear = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** "12 nov. 2026" */
export const formatDate = (iso?: string) => (iso ? dayMonthYear.format(toDate(iso)) : '—');

/** "12 nov. → 15 nov. 2026" (year shown once when both dates share it) */
export const formatStay = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return '—';
  const sameYear = checkIn.slice(0, 4) === checkOut.slice(0, 4);
  return `${(sameYear ? dayMonth : dayMonthYear).format(toDate(checkIn))} → ${formatDate(checkOut)}`;
};

export const countNights = (checkIn?: string, checkOut?: string) =>
  checkIn && checkOut ? Math.max(0, Math.round((toDate(checkOut).getTime() - toDate(checkIn).getTime()) / 86400000)) : 0;

/** "3 nuits", "1 nuit" */
export const nightsLabel = (n: number) => `${n} nuit${n > 1 ? 's' : ''}`;

/** "1 250 DT", "428,4 DT" — the dinar has 3 decimals (millimes), never round them away */
export const formatDT = (amount?: number | null) =>
  amount == null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(amount))} DT`;

const dayMonthTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "3 oct., 14:22" — for timestamps such as "2026-10-03T14:22:11" */
export const formatDateTime = (iso?: string) => (iso ? dayMonthTime.format(new Date(iso)) : '—');
