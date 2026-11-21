import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function SearchField({ value, onChange, label }: SearchFieldProps) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <Input type="search" aria-label={label} placeholder="Search" value={value} onChange={(event) => onChange(event.target.value)} className="pl-9" />
    </div>
  );
}
