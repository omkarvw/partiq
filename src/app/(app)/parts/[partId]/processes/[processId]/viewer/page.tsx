import { Suspense } from "react";
import ProgramViewerPage from "./viewer-client";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-body-md text-on-surface-variant">Loading viewer…</div>}
    >
      <ProgramViewerPage />
    </Suspense>
  );
}
