"use client";

import React from "react";
import { MapPin, Star, Shield, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlaceCardProps {
  name: string;
  address: string;
  distanceKm: number;
  matchScore: number;
  safetyScore: number;
  onClickDetail?: () => void;
}

export default function PlaceCard({ name, address, distanceKm, matchScore, safetyScore, onClickDetail }: PlaceCardProps) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 font-sans">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-lg leading-snug">{name}</h3>
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-455" />
            {address}
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 whitespace-nowrap shrink-0">
          {distanceKm} km
        </Badge>
      </div>

      <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400">교과 매칭</span>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < matchScore ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col border-l border-slate-200 pl-4">
            <span className="text-[9px] font-bold text-slate-400">교통안전</span>
            <div className="flex items-center gap-0.5 text-emerald-600 font-extrabold text-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
              {safetyScore.toFixed(1)}
            </div>
          </div>
        </div>

        {onClickDetail && (
          <button 
            onClick={onClickDetail}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            상세 보기
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
