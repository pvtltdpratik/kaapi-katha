"use client";

import { useEffect } from "react";
import { initSmoothScroll } from "@/lib/smoothScroll";

export function useSmoothScroll() {
  useEffect(() => initSmoothScroll(), []);
}
