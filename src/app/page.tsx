"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side redirect — a server redirect() can't be statically exported.
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
