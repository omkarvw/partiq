"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { CreateQuotationModal } from "@/components/ui/CommercialModals";

export function EnquiryActions({
  enquiryId,
  enquiryLabel,
}: {
  enquiryId: string;
  enquiryLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Quotation
      </Button>
      {open ? (
        <CreateQuotationModal
          open
          onClose={() => setOpen(false)}
          enquiryOptions={[{ id: enquiryId, label: enquiryLabel }]}
          defaultEnquiryId={enquiryId}
        />
      ) : null}
    </>
  );
}
