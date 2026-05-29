"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, MessageSquare, FileText, CheckSquare, Clipboard, Share2, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shareToKakao } from "@/lib/kakao/share";

interface ParentNoticeData {
  notice: string;
  consent: string;
  kakao: string;
  consentUrl: string;
}

export default function ParentNoticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const placeId = searchParams.get("placeId");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParentNoticeData | null>(null);
  const [activeTab, setActiveTab] = useState<"notice" | "consent" | "kakao">("notice");
  const [copied, setCopied] = useState(false);

  // Mock consent rates
  const currentConsentRate = 85;
  const targetConsentRate = 90; // Large/Medium school default RAG target

  // Mock parent responses
  const mockResponses = [
    { id: 1, studentName: "김민재", guardianName: "김정호", contact: "010-1234-5678", status: "agree", note: "환절기 아토피가 있으나 연고 소지 지참합니다." },
    { id: 2, studentName: "이서윤", guardianName: "박선영", contact: "010-9876-5432", status: "agree", note: "멀미가 심해 버스 맨 앞자리에 앉혀주십시오." },
    { id: 3, studentName: "최도윤", guardianName: "최원우", contact: "010-4567-8901", status: "disagree", note: "당일 개인 가족 모임으로 불참합니다." },
    { id: 4, studentName: "박지우", guardianName: "한지혜", contact: "010-3333-4444", status: "agree", note: "특이사항 없음" }
  ];

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        let clientSchoolName = "";
        try {
          const savedProfile = localStorage.getItem("safety_pick_teacher_profile");
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            clientSchoolName = profile.schoolName || "";
          }
        } catch (e) {
          console.error("Failed to parse schoolName from teacher profile:", e);
        }

        const res = await fetch("/api/document/parent-notice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, placeId, schoolName: clientSchoolName }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            setData(resData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [eventId, placeId]);

  const handleCopyUrl = () => {
    if (!data) return;
    const fullUrl = `${window.location.origin}${data.consentUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKakaoShare = () => {
    if (!data) return;
    shareToKakao({
      title: "🏫 현장체험학습 스마트 동의서 제출 안내",
      description: data.kakao.replace("[동의서 링크]", ""),
      linkUrl: data.consentUrl,
      buttonText: "동의서 작성 및 제출"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">학부모 가정통신문 및 모바일 동의서 생성 중...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 font-sans">안내문 정보 로드 실패</h2>
        <Button onClick={() => router.back()} className="bg-blue-600 text-white">뒤로가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">학부모 안내문 및 모바일 안전 동의서</h1>
            <p className="text-xs text-slate-400 font-semibold">간편 스마트 폼과 모바일 큐알 배포 링크가 준비되었습니다.</p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("notice")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "notice" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          가정통신문
        </button>
        <button
          onClick={() => setActiveTab("consent")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "consent" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          모바일 동의 현황
        </button>
        <button
          onClick={() => setActiveTab("kakao")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "kakao" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          카톡 알림톡 공유
        </button>
      </div>

      {/* Dynamic Tab Body */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Tab 1: Notice Markdown rendering */}
        {activeTab === "notice" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-bold text-slate-700">📄 학부모 안내 가정통신문 미리보기</span>
              <Button onClick={() => window.print()} className="bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs rounded-xl">
                가정통신문 인쇄하기
              </Button>
            </div>
            
            <div className="prose prose-slate text-slate-700 leading-relaxed font-semibold max-w-none text-sm space-y-4 whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-150">
              {data.notice}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-slate-800 text-sm mb-3">📄 동봉 동의서 기본 서식</h3>
              <div className="prose prose-slate text-xs bg-slate-100 p-4 rounded-xl font-mono leading-relaxed">
                {data.consent}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile Consent Live Dashboard */}
        {activeTab === "consent" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Consent rate & parent responses */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-blue-600" />
                    안전관리기준 동의율 모니터링
                  </h2>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">대규모(90% 목표)</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-600">실시간 동의율: {currentConsentRate}%</span>
                    <span className="text-slate-400">목표 기준: {targetConsentRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${currentConsentRate}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    ⚠️ 현장체험학습 안전 수칙에 의거하여 학부모 동의율 90% 달성 시에만 정상 시행 가능합니다. 미달 시 계획 변경 결재가 필요합니다.
                  </p>
                </div>
              </div>

              {/* Realtime Responses List */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">✍️ 학부모 실시간 스마트 응답 현황</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                        <th className="p-3">학생명</th>
                        <th className="p-3">보호자</th>
                        <th className="p-3">연락처</th>
                        <th className="p-3">동의여부</th>
                        <th className="p-3">알레르기 및 특이사항</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockResponses.map((res) => (
                        <tr key={res.id} className="border-b border-slate-100 font-medium">
                          <td className="p-3 font-bold text-slate-800">{res.studentName}</td>
                          <td className="p-3">{res.guardianName}</td>
                          <td className="p-3 font-mono">{res.contact}</td>
                          <td className="p-3">
                            <Badge className={res.status === "agree" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                              {res.status === "agree" ? "동의함" : "동의안함"}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-500 font-semibold">{res.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Public URL & QR code */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-center">
                <h3 className="font-bold text-slate-800 text-sm text-left">🔗 학부모 스마트 배포 링크</h3>
                <p className="text-[11px] text-slate-400 font-semibold text-left">
                  아래 배포 주소 혹은 QR코드를 학부모 공지 밴드, 클래스팅, 또는 SMS에 발송해 스마트폰으로 바로 동의서를 제출받으십시오.
                </p>
                
                {/* QR Code Placeholder Card */}
                <div className="w-36 h-36 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center mx-auto shadow-inner p-2 gap-1.5">
                  <div className="w-28 h-28 bg-white border border-slate-300 rounded flex items-center justify-center font-bold text-[8px] text-slate-300 uppercase">
                    [QR CODE LINK]
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">동의서 QR 촬영용</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${data.consentUrl}`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono outline-none"
                  />
                  <Button 
                    onClick={handleCopyUrl}
                    className="bg-blue-600 text-white font-bold text-xs rounded-xl px-3"
                  >
                    {copied ? "복사완료" : "링크복사"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Kakao Notification Sharing */}
        {activeTab === "kakao" && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5 border-b pb-3">
              <Share2 className="w-5 h-5 text-blue-600" />
              카카오톡 알림톡 공유 구성
            </h2>

            {/* Kakao Feed Card Mockup */}
            <div className="bg-slate-100 rounded-2xl p-6 flex flex-col items-stretch space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">카카오톡 Feed 메시지 미리보기</span>
              
              {/* Actual Mimicked Kakao Feed */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-slate-800">
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80')" }} />
                <div className="p-4 space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800">🏫 현장체험학습 스마트 동의서 제출 안내</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                    {data.kakao.replace("[동의서 링크]", "")}
                  </p>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-xs font-bold text-blue-600 hover:bg-slate-100/50">
                  동의서 작성 및 제출
                </div>
              </div>
            </div>

            <Button
              onClick={handleKakaoShare}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black py-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              💬 카카오톡으로 공유하기 (공식 SDK 호출)
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
