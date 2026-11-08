"use client";

import { Button } from "@/components/ui";

export function RetryButton({ label }: { label: string }) {
  return (
    <Button className="mt-4 w-full" onClick={() => window.location.reload()}>
      {label}
    </Button>
  );
}
