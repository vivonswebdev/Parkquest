import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto max-w-5xl space-y-4 px-4 pt-8">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-72 w-full rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
      </div>
    </main>
  );
}
