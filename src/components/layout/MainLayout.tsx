import { Sidebar } from "./Sidebar";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Signed-in shell. No boxed canvas: pages sit straight on the obsidian field,
 * like the landing page, and open with a full-width PageHeader band.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#07070d]">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <VerifyEmailBanner />
        {children}
      </main>
    </div>
  );
}
