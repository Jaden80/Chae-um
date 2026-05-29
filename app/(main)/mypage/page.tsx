"use client";
export const dynamic = 'force-dynamic';

import nextDynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MyPageContent = nextDynamic(
  () => import("./MyPageContent"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div> }
);

export default function MyPage() {
  return <MyPageContent />;
}
