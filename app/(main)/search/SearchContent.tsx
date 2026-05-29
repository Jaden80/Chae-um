"use client";

import React from "react";
import { SearchForm } from "@/components/feature/SearchForm";
import { SchoolInfoCard } from "@/components/feature/SchoolInfoCard";
import RecentHistory from "@/components/feature/RecentHistory";
import { ShieldCheck } from "lucide-react";
import TeacherProfileButton from "@/components/feature/TeacherProfileButton";

export default function SearchContent() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex-1">
          <SchoolInfoCard
            schoolName=""
            address=""
            grade=""
            teacherName=""
          />
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <TeacherProfileButton />
        </div>
      </header>

      <section className="space-y-8 text-center py-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            안전 인증 현장체험학습 AI 큐레이터
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight md:leading-normal">
            어떤 체험학습을 계획하세요?
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto font-medium">
            현장체험학습 주제에 딱 맞는 추천부터 위험도 분석, 행정문서 생성까지 교사의 안전 체험학습 파트너
          </p>
        </div>
        <SearchForm />
      </section>

      <section className="pt-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-150 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <h2 className="text-xl font-bold text-slate-800">최근 추천 이력</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">누가 기록 (최신순)</span>
        </div>
        <RecentHistory />
      </section>
    </div>
  );
}
