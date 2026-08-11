"use client";

import { LeverControl } from "@/components/demo/LeverControl";
import { Num } from "@/components/v2/editors/EditorPrimitives";

export function UtilitiesFields({
  electricityRatePerKwh,
  onChange,
  mode = "input",
}: {
  electricityRatePerKwh: number;
  onChange: (rate: number) => void;
  mode?: "input" | "lever";
}) {
  if (mode === "lever") {
    return (
      <LeverControl
        label="Electricity tariff"
        value={electricityRatePerKwh}
        min={3}
        max={25}
        step={0.5}
        unit="/kWh"
        onChange={onChange}
      />
    );
  }
  return (
    <Num
      label="Electricity ₹ / kWh"
      value={electricityRatePerKwh}
      step={0.5}
      required
      onChange={onChange}
    />
  );
}
