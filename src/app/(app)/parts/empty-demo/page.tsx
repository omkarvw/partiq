import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/ui/Primitives";

export default function EmptyPartsDemoPage() {
  return (
    <div className="p-8">
      <EmptyState
        title="No parts yet"
        description="Create your first part to start capturing process steps, MHR, cycle times, and G-code programs."
        action={
          <Link href="/parts">
            <Button>
              <Plus className="h-4 w-4" />
              Create Part
            </Button>
          </Link>
        }
      />
    </div>
  );
}
