import type { AdminOverview } from "@/services/database.service";

/**
 * Made-up figures for previewing the admin overview before a campus has
 * real activity. The page labels them as sample data wherever they show.
 * Seeded, so the preview looks the same on every load.
 */
function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BOARD_WEIGHTS: [string, number][] = [
  ["marketplace", 0.24],
  ["lost_found", 0.17],
  ["notices", 0.13],
  ["complaints", 0.12],
  ["lending_items", 0.1],
  ["faculty_suggestions", 0.09],
  ["bicycles", 0.07],
  ["blood_donation", 0.05],
  ["animal_welfare", 0.03],
];

// Term rhythm at a Bangladeshi university: intake in January and July, exams in May and November.
const SEASON = [1.25, 1.05, 1.0, 0.95, 0.72, 0.85, 1.2, 1.1, 1.05, 1.0, 0.78, 0.9];

export function sampleOverview(months: 3 | 6 | 12, now = new Date()): AdminOverview {
  const rand = rng(2026);
  const all = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 23 + i, 1);
    const growth = 0.55 + (i / 23) * 0.6;
    const season = SEASON[d.getMonth()];
    const posts = Math.round(620 * growth * season * (0.9 + rand() * 0.2));
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      signups: Math.round((d.getMonth() === 0 || d.getMonth() === 6 ? 310 : 120) * growth * (0.85 + rand() * 0.3)),
      posts,
      reports: Math.max(2, Math.round(posts * (0.018 + rand() * 0.012))),
    };
  });
  const cur = all.slice(24 - months);
  const prev = all.slice(24 - months * 2, 24 - months);
  const sum = (rows: typeof all, k: "signups" | "posts" | "reports") => rows.reduce((n, r) => n + r[k], 0);

  const posts = sum(cur, "posts");
  const prevPosts = sum(prev, "posts");
  const reports = sum(cur, "reports");

  // Split each month's posts across the boards so the boards add up to the Posts figure.
  const sparks = BOARD_WEIGHTS.map(([, w]) => cur.map((r) => r.posts * w * (0.8 + rand() * 0.4)));
  cur.forEach((r, i) => {
    const raw = sparks.reduce((n, s) => n + s[i], 0);
    let left = r.posts;
    sparks.forEach((s, b) => {
      s[i] = b === sparks.length - 1 ? left : Math.round((s[i] / raw) * r.posts);
      left -= b === sparks.length - 1 ? 0 : s[i];
    });
  });
  const boards = BOARD_WEIGHTS.map(([board, w], bi) => {
    const spark = sparks[bi];
    const total = spark.reduce((a, b) => a + b, 0);
    return {
      board,
      posts: total,
      previous: Math.round(prevPosts * w * (0.75 + rand() * 0.4)),
      allTime: total * 2,
      lastPostAt: now.toISOString(),
      openReports: board === "complaints" ? 3 : board === "marketplace" ? 1 : 0,
      spark,
    };
  }).sort((a, b) => b.posts - a.posts);

  return {
    months,
    from: `${cur[0].month}-01`,
    kpis: {
      students: { total: 4812, value: sum(cur, "signups"), previous: sum(prev, "signups") },
      posts: { value: posts, previous: prevPosts },
      activePosters: { value: Math.round(posts * 0.31), previous: Math.round(prevPosts * 0.29) },
      reports: { value: reports, handled: Math.round(reports * 0.93), open: Math.round(reports * 0.07) },
    },
    series: cur.map((r, i) => ({
      month: r.month,
      signups: r.signups,
      signupsPrev: prev[i].signups,
      posts: r.posts,
      postsPrev: prev[i].posts,
      reports: r.reports,
      reportsPrev: prev[i].reports,
    })),
    boards,
    // Sunday to Thursday are teaching days; Thursday evenings are busiest, Friday quietest.
    weekdays: [0.15, 0.15, 0.14, 0.15, 0.19, 0.09, 0.13].map((share, dow) => ({ dow, posts: Math.round(posts * share) })),
  };
}
