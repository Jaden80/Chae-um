"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CalendarDays } from "lucide-react";
import { createEvent } from "@/app/actions/event";
import { useSchoolStore } from "@/store/schoolStore";

const STORAGE_KEY = "safety_pick_teacher_profile";
const HISTORY_KEY = "safety_pick_search_history";
const TRIP_DATE_KEY = "safety_pick_trip_date";

export function SearchForm() {
  const router = useRouter();
  const { selectedSchool } = useSchoolStore();
  const [grade, setGrade] = useState<number>(3);
  const [unit, setUnit] = useState<string>("");
  const [radius, setRadius] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState<string>("");

  // 교사 프로필에서 학년 자동 세팅
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.grade) {
          const gradeNum = parseInt(String(profile.grade), 10);
          if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 6) {
            setGrade(gradeNum);
          }
        }
      }
      // 저장된 희망일 복원
      const savedDate = localStorage.getItem(TRIP_DATE_KEY);
      if (savedDate) setTripDate(savedDate);
    } catch {}

    const handleProfileChange = (e: Event) => {
      const profile = (e as CustomEvent).detail;
      if (profile?.grade) {
        const gradeNum = parseInt(String(profile.grade), 10);
        if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 6) {
          setGrade(gradeNum);
        }
      }
    };
    window.addEventListener("teacherProfileChanged", handleProfileChange);
    return () => window.removeEventListener("teacherProfileChanged", handleProfileChange);
  }, []);

  // 희망일 변경 시 localStorage에 저장
  const handleDateChange = (val: string) => {
    setTripDate(val);
    try {
      if (val) localStorage.setItem(TRIP_DATE_KEY, val);
      else localStorage.removeItem(TRIP_DATE_KEY);
    } catch {}
  };

  const currentSchoolLevel = selectedSchool?.schulKndScNm || "";
  const isMiddle = currentSchoolLevel.includes("중학");
  const isHigh = currentSchoolLevel.includes("고등");

  const chips = isHigh
    ? [
        { label: "고1 사회 - 통합사회", grade: 1, unit: "통합사회" },
        { label: "고1 과학 - 통합과학", grade: 1, unit: "통합과학" },
        { label: "고2 한국사 - 근현대사", grade: 2, unit: "근현대사" },
        { label: "고3 생명과학 - 생태계", grade: 3, unit: "생태계" },
      ]
    : isMiddle
    ? [
        { label: "중1 사회 - 인간과 환경", grade: 1, unit: "인간과 환경" },
        { label: "중2 과학 - 동물과 에너지", grade: 2, unit: "동물과 에너지" },
        { label: "중3 역사 - 현대세계의 변화", grade: 3, unit: "현대세계의 변화" },
        { label: "중3 사회 - 사회 변동과 발전", grade: 3, unit: "사회 변동과 발전" },
      ]
    : [
        { label: "초3 사회 - 우리 고장의 모습", grade: 3, unit: "우리 고장의 모습" },
        { label: "초4 과학 - 식물의 한살이", grade: 4, unit: "식물의 한살이" },
        { label: "초5 사회 - 국토와 우리 생활", grade: 5, unit: "국토와 우리 생활" },
        { label: "초6 과학 - 우리 몸의 구조", grade: 6, unit: "우리 몸의 구조" },
      ];

  const handleChipClick = (chip: (typeof chips)[0]) => {
    setGrade(chip.grade);
    setUnit(chip.unit);
  };

  const getSchoolLevel = (): string => {
    // 1순위: schoolStore의 selectedSchool.schulKndScNm (가장 신뢰도 높음)
    if (selectedSchool?.schulKndScNm) {
      const knd = selectedSchool.schulKndScNm;
      if (knd.includes("초등")) return "초";
      if (knd.includes("중학")) return "중";
      if (knd.includes("고등")) return "고";
      if (knd.includes("특수")) return "특수 ";
    }
    // 2순위: 교사 프로필의 schoolName
    try {
      const rawProfile = localStorage.getItem(STORAGE_KEY);
      if (rawProfile) {
        const profile = JSON.parse(rawProfile);
        if (profile.schoolName) {
          if (profile.schoolName.includes("중학")) return "중";
          if (profile.schoolName.includes("고등")) return "고";
          if (profile.schoolName.includes("특수")) return "특수 ";
        }
      }
    } catch {}
    return "초"; // 기본값
  };

  const saveHistory = (eventId: string, unitValue: string, gradeValue: number) => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const history: any[] = raw ? JSON.parse(raw) : [];
      const schoolLevel = getSchoolLevel();

      history.unshift({
        eventId,
        grade: gradeValue,
        unit: unitValue,
        tripDate: tripDate || null,
        createdAt: new Date().toLocaleDateString("ko-KR"),
        schoolLevel,
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit.trim()) {
      setError("주제명을 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const result = await createEvent({ grade, subject: "기타", unit });
      if (result.success && result.eventId) {
        saveHistory(result.eventId, unit, grade);
        router.push(
          `/search/result?eventId=${result.eventId}&grade=${grade}&subject=%EA%B8%B0%ED%83%80&unit=${encodeURIComponent(unit)}&radius=${radius}`
        );
      } else {
        setError(result.error || "추천을 시작하지 못했습니다.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl group-hover:bg-blue-500/10 transition-all duration-300" />
        <div className="relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">

          {/* Row 1: 주제명 | 반경 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="현장체험학습 장소 또는 주제 입력"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl h-[46px]"
            />

            <div className="relative">
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-3 h-[46px] appearance-none cursor-pointer outline-none transition-colors hover:bg-slate-100/70"
              >
                {[10, 20, 30, 50, 100].map((r) => (
                  <option key={r} value={r}>반경 {r}km 이내</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">▼</div>
            </div>
          </div>

          {/* Row 2: 체험학습 희망일 */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              
              {/* 커스텀 날짜 텍스트 오버레이 */}
              <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none z-10">
                {tripDate ? (
                  <span className="text-slate-800">
                    {(() => {
                      const d = new Date(tripDate);
                      if (isNaN(d.getTime())) return tripDate;
                      const days = ["일", "월", "화", "수", "목", "금", "토"];
                      return `${tripDate}(${days[d.getDay()]})`;
                    })()}
                  </span>
                ) : (
                  <span className="text-slate-400">연도-월-일</span>
                )}
              </div>

              <input
                type="date"
                value={tripDate}
                min={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-[46px] cursor-pointer transition-colors hover:bg-slate-100/70 text-transparent [&::-webkit-datetime-edit]:text-transparent"
              />
            </div>
            <p className="text-xs text-slate-400 font-semibold whitespace-nowrap">
              📅 희망일 선택 시 체험처 상세 화면에서 날씨 정보를 확인할 수 있습니다
            </p>
          </div>

          {/* 추천받기 버튼 */}
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />추천 분석 중...</>
              ) : (
                <><Search className="w-5 h-5" />추천받기</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {chips.map((chip, index) => (
          <Badge
            key={index}
            variant="secondary"
            onClick={() => handleChipClick(chip)}
            className="px-4 py-2 text-sm cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </form>
  );
}
