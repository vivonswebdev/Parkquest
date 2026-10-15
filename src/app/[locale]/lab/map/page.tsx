import { MapScreen } from "@/features/lab/screens/map";

export default async function Page({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const { theme } = await searchParams;
  return <MapScreen initialTheme={theme === "night" ? "night" : "day"} />;
}
