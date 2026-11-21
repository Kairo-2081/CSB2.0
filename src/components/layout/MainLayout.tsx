import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <div className="app-stage">
          {children}
        </div>
      </main>
    </div>
  );
}
