import { Panel } from "@/components/ui/Primitives";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h2 className="text-headline-lg text-on-surface">Settings</h2>
      <p className="mt-1 mb-6 text-body-md text-on-surface-variant">
        Placeholder for plant defaults (currency, time unit). Schema work comes later.
      </p>
      <Panel title="Plant defaults (demo)">
        <div className="space-y-3 p-4">
          <Row label="Currency" value="INR (₹)" />
          <Row label="MHR unit" value="Currency per hour" />
          <Row label="Time units" value="Minutes or seconds (per process version)" />
          <Row
            label="Cost formula"
            value="MHR × (minutes ÷ 60)  or  MHR × (seconds ÷ 3600)"
          />
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center border-b border-outline-variant/40 pb-2 last:border-0">
      <span className="label-caps w-40 text-on-surface-variant">{label}</span>
      <span className="font-mono text-code-md text-on-surface">{value}</span>
    </div>
  );
}
