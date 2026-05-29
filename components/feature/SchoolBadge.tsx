"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { maskSchoolName } from "@/lib/utils/masking";

interface SchoolBadgeProps {
  name: string;
}

export default function SchoolBadge({ name }: SchoolBadgeProps) {
  const masked = maskSchoolName(name);
  return (
    <Badge variant="outline" className="flex items-center gap-1 bg-slate-50 text-slate-700 border-slate-200 font-bold px-2.5 py-1">
      <GraduationCap className="w-4 h-4 text-blue-500" />
      <span>{masked}</span>
    </Badge>
  );
}
