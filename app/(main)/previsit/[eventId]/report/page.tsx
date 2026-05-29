"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, RefreshCw, CheckCircle, ShieldAlert, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VisionItem {
  url: string;
  ai_analysis: string;
}

export default function PrevisitReportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);

  // Priority action items local checklists (Premium interaction)
  const [urgentDone, setUrgentDone] = useState(false);
  const [recommendDone, setRecommendDone] = useState(false);

  useEffect(() => {
    // Generate/fetch checklist report
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/document/previsit-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            checklistData: {}, // Fetching cached representation
            photoUrls: []
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setReportMarkdown(data.content);
            setVisionItems(data.visionAnalyses || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-800">사전답사 AI 보고서 및 사진 판독 보고서 컴파일 중...</h2>
          <p className="text-slate-500 text-sm">소화기 연한, 피난로 통행 안전을 AI 비전으로 정밀 종합 분석하고 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">사전답사 결과 보고서 미리보기</h1>
            <p className="text-xs text-slate-400 font-semibold">사진 AI 안전 진단 및 보완 조치 사항이 매핑되었습니다.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/previsit/${eventId}`)}
            className="border-slate-350 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 px-4 py-5"
          >
            <RefreshCw className="w-4 h-4" />
            다시 답사하기
          </Button>

          <Button 
            onClick={() => window.open(`/document/${eventId}/print`, "_blank")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 px-5 py-5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            보고서 PDF 출력
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Left 2 Cols: Markdown Compiled Report preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-sm font-bold text-slate-700">📄 사전답사 보고서 최종 렌더링</span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">A4 표준 양식</Badge>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-semibold space-y-6 text-sm flex-1 max-h-[65vh] overflow-y-auto pr-2">
            {reportMarkdown.split("\n").map((line, idx) => {
              if (line.startsWith("# ")) {
                return <h1 key={idx} className="text-2xl font-black text-slate-800 border-b pb-2 pt-4">{line.replace("# ", "")}</h1>;
              }
              if (line.startsWith("## ")) {
                return <h2 key={idx} className="text-xl font-bold text-slate-800 border-b pb-1 pt-3">{line.replace("## ", "")}</h2>;
              }
              if (line.startsWith("### ")) {
                return <h3 key={idx} className="text-lg font-bold text-slate-800 pt-2">{line.replace("### ", "")}</h3>;
              }
              if (line.startsWith("- ")) {
                return <li key={idx} className="list-disc pl-4 ml-2">{line.replace("- ", "")}</li>;
              }
              if (line.startsWith("|")) {
                const cells = line.split("|").map(c => c.trim()).filter(Boolean);
                if (line.includes("---")) return null;
                return (
                  <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 border-b border-slate-100 p-2.5 font-bold text-slate-700 text-xs rounded">
                    {cells.map((cell, cIdx) => <span key={cIdx}>{cell}</span>)}
                  </div>
                );
              }
              return <p key={idx} className="min-h-[1rem]">{line}</p>;
            })}
          </div>
        </div>

        {/* Right 1 Col: AI Image Captions & Checkboxes */}
        <div className="space-y-6">
          
          {/* Priority Checklist Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              사전 조치 보완 이행 트래커
            </h3>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              사전답사 시 검출된 긴급/권장 안전 보완 사항을 직접 처리하고 이행 상태를 체크해 학교장 결재 보고서에 연동하십시오.
            </p>

            <div className="space-y-3 pt-2 text-xs font-semibold text-slate-600">
              <div 
                onClick={() => setUrgentDone(!urgentDone)}
                className={`p-3 border rounded-xl flex items-start gap-2 cursor-pointer transition-all ${
                  urgentDone ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
                }`}
              >
                <input type="checkbox" checked={urgentDone} readOnly className="mt-0.5 accent-emerald-600" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-[10px] text-red-600 uppercase block">[긴급 사항]</span>
                  <span>체험처 비상구 앞 화물 적치 제거</span>
                </div>
              </div>

              <div 
                onClick={() => setRecommendDone(!recommendDone)}
                className={`p-3 border rounded-xl flex items-start gap-2 cursor-pointer transition-all ${
                  recommendDone ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
                }`}
              >
                <input type="checkbox" checked={recommendDone} readOnly className="mt-0.5 accent-emerald-600" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-[10px] text-amber-600 uppercase block">[권장 사항]</span>
                  <span>하차구역 안전 고깔 배치 완료</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Vision Photo caption card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">🔍 AI 비전 증빙 사진 정밀 진단</h3>
            
            <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
              {visionItems.map((item, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <img src={item.url} alt={`Diagnostic ${idx + 1}`} className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white font-extrabold text-[8px]">
                      현장 증빙 {idx + 1}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {item.ai_analysis}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
