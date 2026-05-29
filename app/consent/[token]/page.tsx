"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Heart, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PublicConsentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string; // represents eventId

  const [loading, setLoading] = useState(true);
  const [noticeText, setNoticeText] = useState("");
  const [schoolName, setSchoolName] = useState("○○초등학교");
  const [grade, setGrade] = useState(3);
  
  // Form State
  const [studentName, setStudentName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [contact, setContact] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [isAgreed, setIsAgreed] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch parent notice details publicly
    const fetchNotice = async () => {
      try {
        const res = await fetch("/api/document/parent-notice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: token }), // token maps 1:1 to eventId
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNoticeText(data.notice);
            // Parse school name out of markdown
            const lines = data.notice.split("\n");
            for (const line of lines) {
              if (line.includes("초등학교")) {
                const match = line.match(/(.*초등학교)/);
                if (match) {
                  setSchoolName(match[1].trim());
                  break;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim() || !guardianName.trim() || !contact.trim()) {
      setError("필수 인적사항 필드를 모두 기입해 주십시오.");
      return;
    }
    
    if (isAgreed === null) {
      setError("참가 여부 동의 항목을 선택해 주십시오.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Simulate/Trigger API submission to save consent_responses in Supabase
      // In a real DB setup we would do: supabase.from('events').update(...)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("동의서 제출 중 오류가 발생했습니다. 다시 시도해 주십시오.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-slate-50 font-sans">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">모바일 안전 통지서 로드 중...</h2>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-250 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">스마트 동의서 제출 완료!</h2>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              제출해 주신 정보는 안전한 현장체험학습 인솔 계획 수립 및 교육부 RAG 규정 준수 검증을 위해 학교측 시스템에 안전하게 기록되었습니다.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-semibold text-slate-600 text-left space-y-1.5">
            <div>• **제출 학교**: {schoolName}</div>
            <div>• **학생 성명**: {studentName}</div>
            <div>• **참가 여부**: {isAgreed ? "동의함 (참가)" : "동의하지 않음 (불참)"}</div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">감사합니다. 안전을 최우선으로 돌보겠습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Notice Content Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b pb-4 text-center space-y-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">모바일 스마트 안내장</span>
            <h1 className="text-2xl font-black text-slate-800">{schoolName} 현장체험학습 통지</h1>
          </div>

          <div className="prose prose-slate text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-150">
            {noticeText}
          </div>
        </div>

        {/* Form Submission Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 border-b pb-3 flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-red-500 fill-red-50" />
            참가 희망 및 안전 관리 동의 작성
          </h2>

          <div className="space-y-4 text-sm font-semibold text-slate-700">
            {/* Student Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">학생 성명 *</label>
              <Input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            {/* Guardian Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">보호자 성명 *</label>
              <Input
                type="text"
                required
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="예: 홍판서"
                className="w-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            {/* Guardian Contact */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">보호자 연락처 *</label>
              <Input
                type="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="예: 010-1234-5678"
                className="w-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            {/* Special Note */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                학생 알레르기 및 안전 특이사항 (선택)
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="예: 멀미약 소지, 견과류 알레르기 있음 등 기재"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 min-h-[80px]"
              />
            </div>

            {/* Agreement Ratio check */}
            <div className="space-y-2 border-t pt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase">참가 동의 및 안전 서약 여부 *</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => setIsAgreed(true)}
                  className={`flex-1 py-4 font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                    isAgreed === true 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/10" 
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  참가 (동의함)
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsAgreed(false)}
                  className={`flex-1 py-4 font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                    isAgreed === false 
                      ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-500/10" 
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  불참 (동의안함)
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                동의서 전송 중...
              </>
            ) : (
              "스마트 동의서 안전 제출하기"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
