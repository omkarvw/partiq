import { redirect } from "next/navigation";

/** Labour edits live under Impact → Machines → labour. */
export default function ImpactLabourRedirect() {
  redirect("/impact/machines?tab=labour");
}
