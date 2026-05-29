"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useSchoolStore } from "@/store/schoolStore";

const HISTORY_KEY = "safety_pick_search_history";

interface HistoryItem {
  eventId: string;
  grade: number;
  unit: string;
  tripDate: string | null;
  createdAt: string;
  schoolLevel?: string;
}

export default function RecentHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const { selectedSchool } = useSchoolStore();
  const [profileSchoolName, setProfileSchoolName] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setItems(JSON.parse(raw));
      
      const rawProfile = localStorage.getItem("safety_pick_teacher_profile");
      if (rawProfile) {
        const profile = JSON.parse(rawProfile);
        if (profile.schoolName) setProfileSchoolName(profile.schoolName);
      }
    } catch {}
  }, []);

  const getSchoolLevelPrefix = () => {
    // 1순위: schoolStore의 selectedSchool.schulKndScNm (가장 신뢰도 높음)
    if (selectedSchool?.schulKndScNm) {
      const knd = selectedSchool.schulKndScNm;
      if (knd.includes("초등")) return "초";
      if (knd.includes("중학")) return "중";
      if (knd.includes("고등")) return "고";
      if (knd.includes("특수")) return "특수 ";
    }
    // 2순위: 교사 프로필의 schoolName
    if (profileSchoolName) {
      if (profileSchoolName.includes("초등")) return "초";
      if (profileSchoolName.includes("중학")) return "중";
      if (profileSchoolName.includes("고등")) return "고";
      if (profileSchoolName.includes("특수")) return "특수 ";
    }
    return "초"; // 기본값
  };

  const defaultLevelPrefix = getSchoolLevelPrefix();

  // schoolLevel이 명시된 이력만 필터링 (없으면 제외하여 잘못된 기본값 방지)
  const filteredItems = items
    .filter(item => item.schoolLevel === defaultLevelPrefix)
    .slice(0, 5);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 font-medium">아직 추천 이력이 없습니다. 첫 추천을 시작해 보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredItems.map((item, idx) => (
        <Link
          key={item.eventId + idx}
          href={`/search/result?eventId=${item.eventId}&grade=${item.grade}&subject=%EA%B8%B0%ED%83%80&unit=${encodeURIComponent(item.unit)}`}
          className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group gap-4 active:scale-[0.99]"
        >
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2">
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border-blue-200"
              >
                추천 이력
              </Badge>
              <span className="text-xs font-bold text-slate-400">{item.createdAt}</span>
              {item.tripDate && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  🗓 체험 희망일: {item.tripDate.replace(/-/g, ".")}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                {item.schoolLevel || defaultLevelPrefix}{item.grade}학년 &nbsp;·&nbsp; {item.unit}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
            <span>결과 보기</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ))}
    </div>
  );
}
