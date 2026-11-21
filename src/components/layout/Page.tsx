import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageProps {
  children: ReactNode;
  className?: string;
}

/** Content column shared by every signed-in page */
export function Page({ children, className }: PageProps) {
  return <div className={cn("mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-medium leading-tight text-foreground">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        {meta && <div className="stamp mt-3">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

interface ToolbarProps {
  children: ReactNode;
}

/** Search field and filters above a list */
export function Toolbar({ children }: ToolbarProps) {
  return <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>;
}
