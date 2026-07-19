"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { CreateResponseModal } from "@/components/ui/CommercialModals";

export function QuotationActions({
  quotationId,
  quotationLabel,
}: {
  quotationId: string;
  quotationLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Log Response
      </Button>
      {open ? (
        <CreateResponseModal
          open
          onClose={() => setOpen(false)}
          quotationOptions={[{ id: quotationId, label: quotationLabel }]}
          defaultQuotationId={quotationId}
        />
      ) : null}
    </>
  );
}
