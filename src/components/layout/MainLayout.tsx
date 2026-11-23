import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { hueFor } from "@/lib/board-hues";
import { VerifyEmailBanner } from "./VerifyEmailBanner";
import { OfflineBanner } from "./OfflineBanner";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Signed-in shell. No boxed canvas: pages sit straight on the obsidian field,
 * like the landing page, and open with a full-width PageHeader band.
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="hue-scope min-h-screen lg:pl-64" style={{ "--hue": hueFor(pathname) } as React.CSSProperties}>
        <OfflineBanner />
        <VerifyEmailBanner />
        {children}
      </main>
    </div>
  );
}
