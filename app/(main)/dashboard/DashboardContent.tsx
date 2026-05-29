"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Compass, Clock, FileCheck, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/feature/StatusBadge";

export default function DashboardContent() {
  const ongoingEvents = [
    {
      id: "mock-event-101",
      title: "우리 고장의 모습 탐구 현장체험학습",
      grade: 3,
      subject: "사회",
      unit: "우리 고장의 모습",
      placeName: "국립세종수목원 어린이정원",
      tripDate: "2026년 6월 15일",
      status: "selected"
    },
    {
      id: "mock-event-102",
      title: "식물의 한살이 야외 관찰 학습",
      grade: 4,
      subject: "과학",
      unit: "식물의 한살이",
      placeName: "세종호수공원 야생화원",
      tripDate: "2026년 6월 28일",
      status: "document_ready"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans pb-16">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          채움 교사 대시보드
        </h1>
        <span className="text-sm font-bold text-slate-400">나의 현장체험학습 현황</span>
      </div>

      <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">진행 중 체험학습</span>
          <span className="text-3xl font-black text-blue-600 block">2 건</span>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">생성된 공문서</span>
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-black text-emerald-600 block">3 건</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] font-bold px-1.5 py-0.5">100% 매뉴얼 준수</Badge>
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">행정 절감 시간</span>
          <span className="text-3xl font-black text-indigo-600 block flex items-center gap-1">
            <Clock className="w-5 h-5 text-indigo-500" />1.5 시간
          </span>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">다음 사전답사 일정</span>
          <span className="text-sm font-black text-slate-700 block flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />2026년 5월 25일
          </span>
        </div>
      </div>

      <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-inner">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">🚀 새로운 현장체험학습 기획하기</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
          AI 분석 기반의 정밀 안전 진단 및 학교 교과 연계성 매칭을 통해 가장 안전하고 유익한 체험학습 계획을 바로 시작해 보세요.
        </p>
        <Link href="/search" className="inline-block pt-1">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-4 shadow-sm flex items-center gap-1">
            체험학습 분석 및 기획 시작 <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">📋 현재 기획 및 행정 진행 사항</h2>
        <div className="grid gap-6 grid-cols-1">
          {ongoingEvents.map((event) => (
            <div key={event.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">초등 {event.grade}학년 {event.subject}</Badge>
                    <span className="text-xs text-slate-400 font-bold">기획ID: {event.id}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-850 text-lg">{event.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold">체험처: {event.placeName} | 예정일: {event.tripDate}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Link href={`/document/${event.id}`}>
                  <Button variant="outline" className="text-xs font-bold border-slate-350 rounded-xl px-4 py-3">📄 계획서 조율</Button>
                </Link>
                <Link href={`/document/${event.id}/parent-notice`}>
                  <Button variant="outline" className="text-xs font-bold border-slate-350 rounded-xl px-4 py-3">💬 학부모 통지/동의</Button>
                </Link>
                <Link href={`/previsit/${event.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-3 shadow-sm">📸 현장 사전답사 작성</Button>
                </Link>
                <Link href={`/mobile-guide/${event.id}`}>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl px-4 py-3 shadow-sm">📱 당일 모바일 가이드</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
