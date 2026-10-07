import { notFound } from "next/navigation";
import { CREATURES, creatureById } from "@/features/lab/creatures";
import { CreatureScreen } from "@/features/lab/screens/creature";

export function generateStaticParams() {
  return CREATURES.map((c) => ({ id: c.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const c = creatureById((await params).id);
  if (!c) notFound();
  return <CreatureScreen c={c} />;
}
