import { HatchScreen } from "@/features/lab/screens/hatch";

export default async function Page({ searchParams }: { searchParams: Promise<{ replay?: string }> }) {
  const { replay } = await searchParams;
  return <HatchScreen replay={replay === "1"} />;
}
