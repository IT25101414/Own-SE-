import { getDashboardData } from "@/lib/dashboard-data";
import { Dashboard } from "./dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard initialData={data} />;
}
