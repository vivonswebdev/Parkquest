import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function SectionHeader({ title, href, linkLabel, icon }: { title: string; href?: string; linkLabel?: string; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="light-serif flex items-center gap-2 text-xl font-bold md:text-2xl">
        {icon}
        {title}
      </h2>
      {href && linkLabel && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground hover:text-primary">
          {linkLabel}
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
