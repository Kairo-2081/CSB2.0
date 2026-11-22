export const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short" });

/** "22 Nov" for compact places such as phone rows and side lists. */
export function shortDate(date?: string | null) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${monthFmt.format(d)}`;
}

