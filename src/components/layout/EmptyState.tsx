import type { ComponentType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center" role="status">
      <Icon className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
      <h3 className="mt-4 text-base font-medium text-foreground">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
