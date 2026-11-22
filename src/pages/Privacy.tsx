import { Link } from "react-router-dom";

// A plain-language privacy notice. Keep it in step with schema.sql: every
// claim here describes what the code actually stores and shows.
const CONTACT = import.meta.env.VITE_PRIVACY_CONTACT as string | undefined;
const UPDATED = "22 November 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who runs CSB 2.0",
    body: (
      <p>
        CSB 2.0 is a student-run campus services site, currently open to BUET students only. It is not an
        official BUET service.
      </p>
    ),
  },
  {
    title: "What we store",
    body: (
      <ul>
        <li>Your account: name, university email, phone number, department, home district and current residence.</li>
        <li>Your password, stored only as a bcrypt hash. Nobody, including administrators, can read it.</li>
        <li>What you post: notices, complaints, listings, lost and found reports, donor listings and so on.</li>
        <li>Sign-in sessions: when they started and which browser (its user agent), so you can be signed out everywhere.</li>
        <li>Reports you make about other posts, and when you accepted this notice.</li>
      </ul>
    ),
  },
  {
    title: "Who can see it",
    body: (
      <ul>
        <li>Only signed-in students at your own university can see posts. Nothing is public except campus-wide counts on the home page.</li>
        <li>The student directory shows your name, department and role. Your phone and email appear only if you switch that on in your profile.</li>
        <li>Your posts show your name. Complaints and faculty suggestions can be posted anonymously; administrators can still see who posted them so abuse can be handled.</li>
        <li>Phone numbers you type into a listing are shown with that listing.</li>
        <li>Blood donation listings show your name, blood group, location and phone, and only after you agree when you list yourself.</li>
        <li>Administrators can remove posts and see reports. We do not sell or share your data with anyone else.</li>
      </ul>
    ),
  },
  {
    title: "Where it is kept",
    body: (
      <p>
        The site runs on Render and the database on Neon, both in Singapore. Backups are encrypted and kept for
        up to 30 days.
      </p>
    ),
  },
  {
    title: "Your choices",
    body: (
      <ul>
        <li>Delete any of your posts at any time.</li>
        <li>Download everything stored about you from your profile (Your data, then Download).</li>
        <li>Delete your account from your profile. Everything you posted is deleted with it; encrypted backups age out within 30 days.</li>
      </ul>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-3xl px-5 pt-8 sm:px-10">
        <Link to="/" className="flex w-fit items-center gap-3">
          <span className="brand-mark flex h-9 w-9 items-center justify-center text-lg leading-none">C</span>
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-foreground">CSB 2.0</span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Privacy notice · updated {UPDATED}</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-[-0.02em]">
          Your details, <span className="text-primary">in plain words.</span>
        </h1>
        <div className="mt-12 space-y-12">
          {sections.map((s) => (
            <section key={s.title} aria-labelledby={s.title}>
              <h2 id={s.title} className="font-display text-2xl">{s.title}</h2>
              <div className="prose-notice mt-4 text-[15px] leading-7 text-muted-foreground [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
          <section aria-labelledby="contact">
            <h2 id="contact" className="font-display text-2xl">Questions</h2>
            <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
              {CONTACT ? (
                <>Write to <a className="text-accent hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</>
              ) : (
                <>Ask any CSB 2.0 administrator, or use “Report” on a post that shares your details without permission.</>
              )}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
