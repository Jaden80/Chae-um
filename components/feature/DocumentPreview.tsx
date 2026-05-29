"use client";

import React from "react";
import { FileText, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewProps {
  title: string;
  type: string;
  content: string;
}

export default function DocumentPreview({ title, type, content }: DocumentPreviewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 font-sans">
      <div className="flex justify-between items-center border-b pb-3">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-500" />
          {title}
        </span>
        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
          {type === "basic_plan" ? "기본 계획안" : type === "previsit_report" ? "사전답사 보고서" : "학부모 통지문"}
        </Badge>
      </div>

      <div className="max-h-48 overflow-y-auto pr-1">
        <div className="prose prose-slate text-xs text-slate-500 font-semibold leading-relaxed space-y-2 whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );
}
