import { useId, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/CountUp";
import type { AdminOverview } from "@/services/database.service";
import { BOARD_META, CHART, change, longMonth, shortMonth } from "@/lib/overview-format";

const num = new Intl.NumberFormat("en-BD");

/* ---------------------------------------------------------------------------
   Shared pieces for /admin. Colours come from theme tokens so every chart
   works in both the dark and the light theme.
   --------------------------------------------------------------------------- */

/** "▲ 19.9%" in green, "▼ 4.1%" in red, "New" when the last period was empty. */
export function DeltaPill({ value, previous, className }: { value: number; previous: number; className?: string }) {
  const pct = change(value, previous);
  const up = pct !== null && pct > 0.05;
  const down = pct !== null && pct < -0.05;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const label = pct === null ? (value > 0 ? "New" : "No change") : `${Math.abs(pct).toFixed(1)}%`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up && "bg-success/15 text-success",
        down && "bg-destructive/15 text-destructive",
        !up && !down && "bg-foreground/[0.07] text-muted-foreground",
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="sr-only">{up ? "Up" : down ? "Down" : ""}</span>
      {label}
    </span>
  );
}

/** A small line with a soft fill under it that draws itself in. */
export function Sparkline({ data, color = CHART.saffron, className }: { data: number[]; color?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const w = 120;
  const h = 40;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [data.length < 2 ? w : (i / (data.length - 1)) * w, h - 4 - (v / max) * (h - 10)] as const);
  if (pts.length === 1) pts.unshift([0, pts[0][1]]);
  // Smooth the line with midpoint quadratic curves.
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q${x0},${y0} ${mx},${(y0 + y1) / 2}`;
    if (i === pts.length - 1) d += ` T${x1},${y1}`;
  }
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-10 w-28 overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#sf-${id})`} className="animate-[enter-fade_900ms_ease_300ms_both]" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" pathLength={1} className="spark-draw" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} className="animate-[enter-scale_400ms_ease_1000ms_both]" />
    </svg>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "surface relative overflow-hidden rounded-2xl p-6 sm:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelTitle({ title, subtitle, action, id }: { title: string; subtitle?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-[28px] leading-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pill-shaped segmented control with a sliding highlight. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-label={label} className="relative inline-grid rounded-full border border-foreground/10 bg-foreground/[0.03] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full border border-foreground/10 bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors",
            o.value === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One of the four figures across the top. */
export function KpiCard({
  label,
  value,
  previous,
  spark,
  color,
  months,
  footer,
  format,
}: {
  label: string;
  value: number;
  previous?: number;
  spark?: number[];
  color: string;
  months: number;
  footer?: ReactNode;
  format?: (n: number) => string;
}) {
  return (
    <div className="surface lift group relative overflow-hidden rounded-2xl p-6">
      <span aria-hidden="true" className="animate-grow-x absolute left-6 top-0 h-[2px] w-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-[40px] font-semibold leading-none tracking-tight">
        <CountUp value={value} format={format} />
      </p>
      {footer ?? (
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <DeltaPill value={value} previous={previous ?? 0} />
            <p className="mt-1.5 text-xs text-muted-foreground">vs previous {months} months</p>
          </div>
          {spark && <Sparkline data={spark} color={color} className="transition-transform duration-500 group-hover:scale-105" />}
        </div>
      )}
    </div>
  );
}

type Metric = "posts" | "signups" | "reports";
const METRIC_LABEL: Record<Metric, string> = { posts: "Posts", signups: "Sign-ups", reports: "Reports" };

function TrendTooltip({ active, payload, label, metric }: TooltipProps<number, string> & { metric: Metric }) {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === metric)?.value ?? 0;
  const prev = payload.find((p) => p.dataKey === `${metric}Prev`)?.value ?? 0;
  return (
    <div className="rounded-xl border border-foreground/10 bg-popover/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
      <p className="text-xs text-muted-foreground">{longMonth(String(label))}</p>
      <p className="mt-1.5 flex items-center justify-between gap-6">
        <span className="flex items-center gap-2 font-semibold tabular-nums"><span className="h-2 w-2 rounded-full" style={{ background: CHART.saffron }} />{num.format(cur)}</span>
        <span className="text-muted-foreground">this period</span>
      </p>
      <p className="mt-1 flex items-center justify-between gap-6">
        <span className="flex items-center gap-2 font-semibold tabular-nums"><span className="h-2 w-2 rounded-full bg-muted-foreground" />{num.format(prev)}</span>
        <span className="text-muted-foreground">period before</span>
      </p>
    </div>
  );
}

/** The large area chart with the previous period dotted underneath. */
export function TrendCard({ data }: { data: AdminOverview }) {
  const [metric, setMetric] = useState<Metric>("posts");
  const gid = useId().replace(/:/g, "");
  const best = useMemo(
    () => data.series.reduce((b, r) => (r[metric] > b[metric] ? r : b), data.series[0]),
    [data.series, metric],
  );
  return (
    <Panel className="lg:col-span-2">
      <PanelTitle
        id="trend"
        title="Activity trend"
        subtitle={`${METRIC_LABEL[metric]} each month, with the ${data.months} months before dotted`}
        action={
          <Segmented<Metric>
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={(Object.keys(METRIC_LABEL) as Metric[]).map((m) => ({ value: m, label: METRIC_LABEL[m] }))}
          />
        }
      />
      <div className="mt-6 h-[300px] w-full" role="img" aria-label={`${METRIC_LABEL[metric]} per month`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.series} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.saffron} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.saffron} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="month" tickFormatter={shortMonth} tickLine={false} axisLine={false} tick={{ fill: CHART.muted, fontSize: 12 }} dy={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART.muted, fontSize: 12 }} width={48} allowDecimals={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(v))} />
            <Tooltip content={<TrendTooltip metric={metric} />} cursor={{ stroke: CHART.muted, strokeDasharray: "3 4" }} />
            <Line key={`${metric}-prev`} type="monotone" dataKey={`${metric}Prev`} stroke={CHART.muted} strokeOpacity={0.7} strokeWidth={1.5}
              strokeDasharray="3 5" dot={false} activeDot={{ r: 4, fill: CHART.muted, strokeWidth: 0 }} animationDuration={1100} />
            <Area key={metric} type="monotone" dataKey={metric} stroke={CHART.saffron} strokeWidth={2.5} fill={`url(#area-${gid})`}
              dot={false} activeDot={{ r: 6, fill: "hsl(var(--background))", stroke: CHART.saffron, strokeWidth: 3 }}
              animationDuration={1200} animationEasing="ease-out" style={{ filter: `drop-shadow(0 4px 12px hsl(var(--glow) / 0.35))` }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2"><span className="h-[3px] w-5 rounded-full" style={{ background: CHART.saffron }} />This period</span>
          <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dotted border-muted-foreground" />The period before</span>
        </div>
        {best && best[metric] > 0 && (
          <span>Best month · <b className="font-semibold text-foreground">{shortMonth(best.month)}</b> · {num.format(best[metric])}</span>
        )}
      </div>
    </Panel>
  );
}

/** Where students post: a ring of the busiest boards. */
export function ShareDonut({ data }: { data: AdminOverview }) {
  const total = data.boards.reduce((n, b) => n + b.posts, 0);
  const top = data.boards.filter((b) => b.posts > 0).slice(0, 3);
  const other = total - top.reduce((n, b) => n + b.posts, 0);
  const slices = [
    ...top.map((b, i) => ({ name: BOARD_META[b.board]?.label ?? b.board, value: b.posts, color: [CHART.saffron, CHART.green, CHART.blue][i] })),
    ...(other > 0 ? [{ name: "Other boards", value: other, color: CHART.olive }] : []),
  ];
  const ring = slices.length ? slices : [{ name: "No posts yet", value: 1, color: CHART.grid }];
  return (
    <Panel>
      <PanelTitle id="share" title="Where students post" subtitle={`Share of ${num.format(total)} posts`} />
      <div className="relative mx-auto mt-4 h-[230px] w-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ring} dataKey="value" innerRadius={78} outerRadius={104} paddingAngle={slices.length > 1 ? 4 : 0} cornerRadius={10}
              startAngle={90} endAngle={-270} stroke="none" animationDuration={1100} animationEasing="ease-out">
              {ring.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tracking-tight"><CountUp value={total} /></span>
          <span className="text-sm text-muted-foreground">posts</span>
        </div>
      </div>
      <ul className="stagger mt-5 space-y-3">
        {slices.map((s) => (
          <li key={s.name} className="grid grid-cols-[auto_1fr_auto_3.5rem] items-center gap-3 text-[15px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className="font-semibold tabular-nums">{num.format(s.value)}</span>
            <span className="text-right tabular-nums text-muted-foreground">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
        {!slices.length && <li className="text-sm text-muted-foreground">Nothing posted in this period.</li>}
      </ul>
    </Panel>
  );
}

// The Bangladeshi week starts on Saturday.
const WEEK = [6, 0, 1, 2, 3, 4, 5];
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeekdayBars({ data }: { data: AdminOverview }) {
  const byDow = new Map(data.weekdays.map((d) => [d.dow, d.posts]));
  const max = Math.max(1, ...data.weekdays.map((d) => d.posts));
  const ranked = [...data.weekdays].sort((a, b) => b.posts - a.posts);
  const busiest = ranked[0]?.posts ? ranked[0].dow : -1;
  const subtitle = busiest >= 0
    ? `${DAY_LONG[ranked[0].dow]}${ranked[1]?.posts ? ` and ${DAY_LONG[ranked[1].dow]}` : ""} are the busiest`
    : "No posts in this period";
  return (
    <Panel className="flex flex-col">
      <PanelTitle id="weekday" title="Posts by weekday" subtitle={subtitle} />
      <div className="mt-8 grid min-h-[260px] flex-1 grid-cols-7 items-end gap-2.5 sm:gap-3">
        {WEEK.map((dow, i) => {
          const v = byDow.get(dow) ?? 0;
          const top = dow === busiest;
          return (
            <div key={dow} className="group flex h-full flex-col items-center justify-end gap-2">
              <span className={cn("text-xs font-semibold tabular-nums transition-opacity", top ? "text-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100")}>
                {num.format(v)}
              </span>
              <div className="relative flex h-full w-full items-end overflow-hidden rounded-xl bg-foreground/[0.04]">
                <div
                  className={cn("animate-grow-up w-full rounded-xl transition-[filter] duration-300 hover:brightness-110", !top && "opacity-80")}
                  style={{
                    height: `${Math.max(2, (v / max) * 100)}%`,
                    animationDelay: `${120 + i * 70}ms`,
                    background: top
                      ? "linear-gradient(180deg, hsl(var(--glow) / 0.95), hsl(var(--glow) / 0.55))"
                      : "linear-gradient(180deg, hsl(var(--muted-foreground) / 0.45), hsl(var(--muted-foreground) / 0.18))",
                    boxShadow: top ? "0 0 30px hsl(var(--glow) / 0.35)" : undefined,
                  }}
                />
              </div>
              <span className={cn("text-sm", top ? "font-semibold text-foreground" : "text-muted-foreground")}>{DAY[dow]}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function BoardTable({ data }: { data: AdminOverview }) {
  const rows = data.boards.slice(0, 6);
  return (
    <Panel className="lg:col-span-2">
      <PanelTitle
        id="boards"
        title="Busiest boards"
        subtitle={`Ranked by posts, last ${data.months} months`}
        action={<Link to="/central-admin" className="rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/35 hover:bg-foreground/[0.04]">Moderation queue</Link>}
      />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-foreground/[0.08] text-sm text-muted-foreground">
              <th className="pb-3 font-normal">Board</th>
              <th className="pb-3 text-right font-normal">Posts</th>
              <th className="pb-3 pl-6 font-normal">Change</th>
              <th className="pb-3 font-normal">Trend</th>
              <th className="pb-3 font-normal"><span className="sr-only">Status</span></th>
            </tr>
          </thead>
          <tbody className="stagger">
            {rows.map((b) => {
              const meta = BOARD_META[b.board] ?? { label: b.board, href: "#", tone: "bg-muted text-foreground" };
              const status = b.openReports > 0
                ? { text: `${b.openReports} report${b.openReports > 1 ? "s" : ""} open`, cls: "border-warning/40 bg-warning/10 text-warning" }
                : b.posts > 0
                  ? { text: "Active", cls: "border-success/40 bg-success/10 text-success" }
                  : { text: "Quiet", cls: "border-foreground/15 text-muted-foreground" };
              return (
                <tr key={b.board} className="row-hover border-b border-foreground/[0.06] last:border-0">
                  <td className="py-3.5 pr-4">
                    <Link to={meta.href} className="group flex items-center gap-3.5 font-semibold">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", meta.tone)}>
                        {meta.label.charAt(0)}
                      </span>
                      <span className="group-hover:underline group-hover:underline-offset-4">{meta.label}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 text-right font-semibold tabular-nums">{num.format(b.posts)}</td>
                  <td className="py-3.5 pl-6"><DeltaPill value={b.posts} previous={b.previous} /></td>
                  <td className="py-3.5"><Sparkline data={b.spark} className="h-9 w-28" /></td>
                  <td className="py-3.5 text-right">
                    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium", status.cls)}>{status.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
