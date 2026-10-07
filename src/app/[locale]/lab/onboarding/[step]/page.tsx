import { notFound } from "next/navigation";
import { OnboardingScreen } from "@/features/lab/screens/onboarding";

export function generateStaticParams() {
  return ["1", "2", "3", "4", "5"].map((step) => ({ step }));
}

export default async function Page({ params }: { params: Promise<{ step: string }> }) {
  const step = Number((await params).step);
  if (!Number.isInteger(step) || step < 1 || step > 5) notFound();
  return <OnboardingScreen step={step} />;
}
