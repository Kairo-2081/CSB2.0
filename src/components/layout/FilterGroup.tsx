import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroupProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Segmented filter; the selected option is a raised step, not the accent */
export function FilterGroup({ label, options, value, onChange }: FilterGroupProps) {
  return (
    <div role="group" aria-label={label} className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-md px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
