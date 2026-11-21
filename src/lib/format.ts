const currentYear = new Date().getFullYear();

/** `27 Dec` this year, `27 Dec 2025` otherwise */
export function formatDate(value: string | number | Date | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== currentYear && { year: "numeric" }),
  });
}

/** `27 Dec · 19:44` */
export function formatStamp(value: string | number | Date | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${formatDate(date)} · ${time}`;
}

export function formatCount(value: number, noun: string, plural = `${noun}s`): string {
  return `${value.toLocaleString("en-US")} ${value === 1 ? noun : plural}`;
}
