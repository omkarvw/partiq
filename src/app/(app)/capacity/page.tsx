"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Capacity / shopfloor deferred — redirect until revived. */
export default function V2CapacityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/factory");
  }, [router]);
  return (
    <div className="p-8 text-body-sm text-on-surface-variant">
      Capacity planner is deferred. Redirecting to Factory…
    </div>
  );
}
