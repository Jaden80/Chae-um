"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ResultContent = dynamic(() => import("./ResultContent"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
      <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
    </div>
  ),
});

export default function ResultPageWrapper() {
  return <ResultContent />;
}
