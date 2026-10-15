import { HatchScreen } from "@/features/lab/screens/hatch";

export default async function Page({ searchParams }: { searchParams: Promise<{ replay?: string; egg?: string }> }) {
  const { replay, egg } = await searchParams;
  const e = egg === "forest" || egg === "river" || egg === "dusk" ? egg : undefined;
  return <HatchScreen replay={replay === "1" || !!e} egg={e} />;
}
