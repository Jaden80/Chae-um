"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (s: string) => {
    switch (s) {
      case "draft":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "searching":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "selected":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "document_ready":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "draft":
        return "초안 작성";
      case "searching":
        return "추천 분석 중";
      case "selected":
        return "장소 결정";
      case "document_ready":
        return "행정서류 준비";
      case "completed":
        return "정산 및 완료";
      default:
        return "진행 대기";
    }
  };

  return (
    <Badge className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border ${getStatusStyle(status)}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}
