"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, LogOut, X, Search, Loader2, CheckCircle2, GraduationCap, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TeacherProfile {
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
  grade: string;
  classNum: string;
  schoolLat?: number;
  schoolLng?: number;
}

const STORAGE_KEY = "safety_pick_teacher_profile";

const defaultProfile: TeacherProfile = {
  teacherName: "홍길동",
  schoolName: "세종초등학교",
  schoolAddress: "세종특별자치시 반곡동",
  grade: "3",
  classNum: "1",
  schoolLat: 36.4800,
  schoolLng: 127.2890,
};

interface NeisSchool {
  SCHUL_NM: string;
  ORG_RDNMA: string;
  LCTN_SC_NM: string;
  SD_SCHUL_CODE: string;
  ATPT_OFCDC_SC_CODE: string;
  LA?: string;
  LO?: string;
}

export default function TeacherProfileButton() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile>(defaultProfile);
  const [draft, setDraft] = useState<TeacherProfile>(defaultProfile);

  // NEIS school search state
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState<NeisSchool[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<NeisSchool | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setDraft(parsed);
      } catch {}
    }
  }, []);

  // Sync profile to parent pages via custom event
  const broadcastProfile = (p: TeacherProfile) => {
    window.dispatchEvent(new CustomEvent("teacherProfileChanged", { detail: p }));
  };

  const router = useRouter();



  const handleOpen = () => {
    setDraft({ ...profile });
    setSchoolQuery("");
    setSchoolResults([]);
    setSelectedSchool(null);
    setOpen(true);
  };

  const handleSave = () => {
    const updated: TeacherProfile = selectedSchool
      ? {
          ...draft,
          schoolName: selectedSchool.SCHUL_NM,
          schoolAddress: selectedSchool.ORG_RDNMA,
          schoolLat: selectedSchool.LA ? parseFloat(selectedSchool.LA) : draft.schoolLat,
          schoolLng: selectedSchool.LO ? parseFloat(selectedSchool.LO) : draft.schoolLng,
        }
      : draft;
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastProfile(updated);
    setOpen(false);
  };

  const handleSearchSchool = async () => {
    if (!schoolQuery.trim()) return;
    setSearching(true);
    setSchoolResults([]);

    try {
      const apiKey = "4c22d33184cd465f852281a499ba2772";
      const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=10&SCHUL_NM=${encodeURIComponent(schoolQuery)}`;
      const res = await fetch(url);
      const json = await res.json();

      const rows: NeisSchool[] =
        json?.schoolInfo?.[1]?.row ?? [];
      setSchoolResults(rows);

      if (rows.length === 0) {
        alert("검색 결과가 없습니다. 학교명을 다시 확인해 주세요.");
      }
    } catch (err) {
      console.error("NEIS 학교 검색 오류:", err);
      // Fallback mock results
      setSchoolResults([
        {
          SCHUL_NM: `${schoolQuery}초등학교`,
          ORG_RDNMA: "세종특별자치시",
          LCTN_SC_NM: "세종특별자치시",
          SD_SCHUL_CODE: "mock-1",
          ATPT_OFCDC_SC_CODE: "M10",
        },
      ]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      {/* Profile Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:border-blue-300 rounded-full border border-slate-200/50 transition-colors group"
      >
        <User className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
        <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600">
          {profile.teacherName} 교사
        </span>
        <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
      </button>



      {/* Edit Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 z-10 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">교사 정보 편집</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">소속교와 담당 학년을 수정합니다</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Teacher Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">교사 이름</label>
              <Input
                value={draft.teacherName}
                onChange={(e) => setDraft({ ...draft, teacherName: e.target.value })}
                placeholder="예: 홍길동"
                className="bg-slate-50 border-slate-200 rounded-xl py-5 font-semibold text-sm"
              />
            </div>

            {/* School Search via NEIS */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                소속 학교 검색 (NEIS 교육정보 API)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={schoolQuery}
                    onChange={(e) => setSchoolQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSchool()}
                    placeholder="학교명 입력 (예: 한솔)"
                    className="pl-9 bg-slate-50 border-slate-200 rounded-xl py-5 font-semibold text-sm"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSearchSchool}
                  disabled={searching}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl px-4 shrink-0"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
                </Button>
              </div>

              {/* Search Results */}
              {schoolResults.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {schoolResults.map((school, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSchool(school);
                        setDraft({
                          ...draft,
                          schoolName: school.SCHUL_NM,
                          schoolAddress: school.ORG_RDNMA,
                          schoolLat: school.LA ? parseFloat(school.LA) : draft.schoolLat,
                          schoolLng: school.LO ? parseFloat(school.LO) : draft.schoolLng,
                        });
                        setSchoolResults([]);
                        setSchoolQuery(school.SCHUL_NM);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-semibold hover:bg-blue-50 flex items-center gap-2 border-b border-slate-100 last:border-0 transition-colors ${
                        selectedSchool?.SD_SCHUL_CODE === school.SD_SCHUL_CODE
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700"
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-bold">{school.SCHUL_NM}</span>
                        <span className="text-slate-400 ml-1.5">({school.LCTN_SC_NM})</span>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{school.ORG_RDNMA}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected school badge */}
              {selectedSchool && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  선택된 학교: {selectedSchool.SCHUL_NM} ({selectedSchool.LCTN_SC_NM})
                </div>
              )}

              {/* Current school name if no NEIS result selected */}
              {!selectedSchool && (
                <p className="text-[10px] text-slate-400 font-semibold">
                  현재 설정: {draft.schoolName} ({draft.schoolAddress})
                </p>
              )}
            </div>

            {/* Grade */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">담당 학년</label>
              <select
                value={draft.grade}
                onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={String(g)}>{g}학년</option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-sm shadow-sm"
            >
              변경사항 저장하기
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
