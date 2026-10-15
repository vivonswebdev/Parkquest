import { notFound } from "next/navigation";
import { creatureById } from "@/features/lab/creatures";
import { CreatureScreen } from "@/features/lab/screens/creature";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fond?: string }> }) {
  const c = creatureById((await params).id);
  if (!c) notFound();
  const { fond } = await searchParams;
  return <CreatureScreen c={c} initialBackdrop={fond === "nuit" ? "night" : "light"} />;
}
