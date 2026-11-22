import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderPhoto {
  /** A band photo from public/campus/bands (graded, 1100×520, with grain). */
  src: string;
  alt: string;
  /** CSS object-position, e.g. "50% 40%", to keep the subject in frame. */
  position?: string;
}

interface PageHeaderProps {
  /** Short section label shown after "BUET", e.g. "Announcements". */
  eyebrow?: string;
  title: ReactNode;
  /** Optional second clause, set in pale sand like the landing headline. */
  accent?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A campus photograph that fills the band behind the title. */
  photo?: PageHeaderPhoto;
  className?: string;
}

/**
 * The opening band of every signed-in page. It is the landing hero at a
 * smaller scale: a graded campus photograph bleeding to the edges and fading
 * into the page from the left, with the serif headline set over it.
 */
export function PageHeader({ eyebrow, title, accent, description, actions, photo, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative isolate -mx-5 flex flex-col justify-end overflow-hidden px-5 pb-10 pt-28 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
        photo ? "min-h-[420px] lg:min-h-[460px]" : "min-h-[280px] lg:min-h-[320px]",
        className,
      )}
    >
      {photo ? (
        <>
          <img
            src={photo.src}
            alt={photo.alt}
            decoding="async"
            className="page-band-photo absolute inset-0 -z-20 h-full w-full object-cover lg:left-auto lg:right-0 lg:w-[78%]"
            style={photo.position ? { objectPosition: photo.position } : undefined}
          />
          <div aria-hidden="true" className="page-band-shade absolute inset-0 -z-10" />
        </>
      ) : (
        <div aria-hidden="true" className="page-band-glow absolute inset-0 -z-10" />
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[640px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#cfc5ba]">
            BUET
            {eyebrow && (
              <>
                <span aria-hidden="true" className="mx-2 opacity-50">•</span>
                {eyebrow}
              </>
            )}
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,4.6vw,4.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-foreground">
            {title}
            {accent && (
              <>
                <br />
                <span className="text-[#cdb9a5]/80">{accent}</span>
              </>
            )}
          </h1>
          <div aria-hidden="true" className="mt-7 h-px w-10 bg-foreground/50" />
          {description && <p className="mt-5 max-w-[460px] text-[15px] leading-7 text-[#d6cec5]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
