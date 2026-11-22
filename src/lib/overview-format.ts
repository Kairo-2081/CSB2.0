/** Colours, board names and month formats for the admin overview. */

export const CHART = {
  saffron: "hsl(var(--glow))",
  green: "hsl(var(--success))",
  blue: "hsl(var(--info))",
  olive: "hsl(var(--muted-foreground) / 0.55)",
  grid: "hsl(var(--chart-grid))",
  muted: "hsl(var(--muted-foreground))",
};

export const BOARD_META: Record<string, { label: string; href: string; tone: string }> = {
  marketplace: { label: "Marketplace", href: "/marketplace", tone: "bg-[hsl(var(--glow)/0.85)] text-[#1a1206]" },
  lost_found: { label: "Lost and found", href: "/lost-found", tone: "bg-success/80 text-success-foreground" },
  notices: { label: "Notices", href: "/notices", tone: "bg-info/80 text-info-foreground" },
  complaints: { label: "Complaints", href: "/complaints", tone: "bg-destructive/75 text-destructive-foreground" },
  lending_items: { label: "Lend and borrow", href: "/lend-borrow", tone: "bg-[hsl(268_45%_72%)] text-[#1b1328]" },
  faculty_suggestions: { label: "Faculty suggestions", href: "/faculty-suggestions", tone: "bg-[hsl(24_60%_68%)] text-[#24140a]" },
  bicycles: { label: "Bicycles", href: "/bicycles", tone: "bg-[hsl(180_35%_60%)] text-[#0b1e1e]" },
  blood_donation: { label: "Blood donation", href: "/blood-donation", tone: "bg-[hsl(354_55%_62%)] text-white" },
  animal_welfare: { label: "Animal welfare", href: "/animal-welfare", tone: "bg-[hsl(90_30%_58%)] text-[#141c0b]" },
};

const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
const toDate = (ym: string) => new Date(`${ym}-01T00:00:00`);
export const shortMonth = (ym: string) => monthShort.format(toDate(ym));
export const longMonth = (ym: string) => monthLong.format(toDate(ym));

/** Percentage change, or null when there is nothing to compare with. */
export function change(value: number, previous: number): number | null {
  if (!previous) return null;
  return ((value - previous) / previous) * 100;
}

