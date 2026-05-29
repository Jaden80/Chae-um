"use client";

import React from "react";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SafetyScoreCardProps {
  score: number;
  pedestrianAccidents: number;
  schoolZoneAccidents: number;
}

export default function SafetyScoreCard({ score, pedestrianAccidents, schoolZoneAccidents }: SafetyScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 4.5) return "from-emerald-500 to-teal-600 text-white";
    if (s >= 3.5) return "from-amber-400 to-amber-500 text-slate-800";
    return "from-red-500 to-rose-600 text-white";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
        <span className="text-[10px] font-bold text-slate-400 block uppercase">스쿨존 어린이 사고</span>
        <span className="text-lg font-black text-slate-800 flex items-center justify-center gap-1">
          <AlertTriangle className={`w-4 h-4 ${schoolZoneAccidents > 0 ? "text-amber-500" : "text-emerald-500"}`} />
          {schoolZoneAccidents} 건
        </span>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
        <span className="text-[10px] font-bold text-slate-400 block uppercase">보행자 사고 (1km)</span>
        <span className="text-lg font-black text-slate-800 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-slate-400" />
          {pedestrianAccidents} 건
        </span>
      </div>

      <div className={`p-4 bg-gradient-to-br ${getScoreColor(score)} rounded-2xl text-center space-y-1 shadow-sm`}>
        <span className="text-[10px] font-bold opacity-80 block uppercase">통합 교통안전 지수</span>
        <span className="text-lg font-black flex items-center justify-center gap-1">
          <Shield className="w-4.5 h-4.5 opacity-90 fill-current/10" />
          {score} / 5.0
        </span>
      </div>
    </div>
  );
}
