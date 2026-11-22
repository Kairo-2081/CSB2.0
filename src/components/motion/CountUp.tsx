import { useCountUp } from "@/hooks/use-count-up";

const defaultFormat = new Intl.NumberFormat("en-BD");

/** A number that counts up when it appears or changes. Screen readers get the final value. */
export function CountUp({
  value,
  format = (n) => defaultFormat.format(Math.round(n)),
  duration,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const shown = useCountUp(value, duration);
  return (
    <span className={className}>
      <span aria-hidden="true" className="tabular-nums">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
