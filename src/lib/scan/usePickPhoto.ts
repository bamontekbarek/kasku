"use client";

import { useAppRouter } from "@/components/NavProgress";
import type { ChangeEvent } from "react";
import { scanStore } from "./store";

/** onChange for a camera/gallery <input type=file>: hand the photo to the crop screen. */
export function usePickPhoto() {
  const router = useAppRouter();
  return (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    scanStore.start(file);
    router.push("/scan/crop");
  };
}
