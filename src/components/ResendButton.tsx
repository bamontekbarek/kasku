"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

/** Disabled "Kirim ulang dalam 0:59" countdown that turns into a resend button. */
export function ResendButton({ label, size = "lg", seconds = 59 }: { label: string; size?: "lg" | "md"; seconds?: number }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  if (left > 0) {
    return (
      <Button disabled size={size} className="!bg-surface tabular-nums">
        Kirim ulang dalam 0:{String(left).padStart(2, "0")}
      </Button>
    );
  }
  // TODO: call the resend endpoint before restarting the timer
  return (
    <Button variant="secondary" size={size} onClick={() => setLeft(seconds)}>
      {label}
    </Button>
  );
}
