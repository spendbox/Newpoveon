"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackView } from "@/lib/track";

/** Counts each page opened (anonymously) for Admin → Visitors and drop-off. Admin pages aren't counted. */
export function PageView() {
  const path = usePathname();
  useEffect(() => {
    if (path) trackView(path);
  }, [path]);
  return null;
}
