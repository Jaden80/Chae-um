export const dynamic = 'force-dynamic';
import React from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck, Download, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* Back Button */}
      <Link href="/search">
        <Button variant="ghost" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 -ml-4">
          <ArrowLeft className="w-4 h-4" />
          메인 검색 화면으로
        </Button>
      </Link>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-extrabold text-slate-800">
            현장체험학습 행정문서 생성
          </h1>
          <span className="text-xs font-bold text-slate-400">자동 문서화 서비스</span>
        </div>

        {/* Dynamic Checklist / PDF Generation Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Document card 1 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">행정 계획서</span>
              <h2 className="text-lg font-bold text-slate-800">
                1. 현장체험학습 계획 및 품의서
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                NEIS 등 행정품의용 계획 마크다운 파일과 PDF 파일 자동 생성본입니다.
              </p>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 py-5 rounded-xl">
              <Download className="w-4 h-4" />
              계획서 PDF 다운로드
            </Button>
          </div>

          {/* Document card 2 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">안전 관리</span>
              <h2 className="text-lg font-bold text-slate-800">
                2. 안전 관리 세부 계획서
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                차량대열운행 예방 조치, 안전 사고 예방 및 비상 대책이 포함되어 있습니다.
              </p>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 py-5 rounded-xl">
              <Download className="w-4 h-4" />
              안전계획서 PDF 다운로드
            </Button>
          </div>

          {/* Document card 3 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">가정 통신</span>
              <h2 className="text-lg font-bold text-slate-800">
                3. 학부모 안내장 (가정통신문)
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                체험 일정, 필요 준비물, 참가 신청 및 동의서 영수 양식이 내포된 안내장입니다.
              </p>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 py-5 rounded-xl">
              <Download className="w-4 h-4" />
              안내장 한글(HWP) 복사
            </Button>
          </div>

          {/* Document card 4 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">사전 답사</span>
              <h2 className="text-lg font-bold text-slate-800">
                4. 현장체험학습 사전답사 보고서
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                안전인증 결과, 교통 위험 지도 분석이 가미된 자동 작성 답사 보고서입니다.
              </p>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 py-5 rounded-xl">
              <Download className="w-4 h-4" />
              답사보고서 다운로드
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
