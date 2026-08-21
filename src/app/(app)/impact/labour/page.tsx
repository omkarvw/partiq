import { redirect } from "next/navigation";

/** Labour edits live under Master data → Machines → labour. */
export default function ImpactLabourRedirect() {
  redirect("/master-data/machines?tab=labour");
}
