"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, Download, Save, Edit3, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateDraftTemplate } from "@/lib/utils/documentTemplate";

export default function DocumentEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get("placeId");

  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  
  // Mock Place Data
  const [placeName, setPlaceName] = useState("대한민국역사박물관");
  const [placeAddress, setPlaceAddress] = useState("서울 종로구 세종대로 198");

  useEffect(() => {
    // In a real app, fetch place details and user profile here.
    // For now, extract from query params or use defaults
    const nameParam = searchParams.get("placeName");
    const addressParam = searchParams.get("address");

    if (nameParam) setPlaceName(nameParam);
    if (addressParam) setPlaceAddress(addressParam);

    // Initial draft generation
    const initialDraft = generateDraftTemplate({
      schoolName: "세종아름초등학교",
      grade: "3",
      placeName: nameParam || "대한민국역사박물관",
      placeAddress: addressParam || "서울 종로구 세종대로 198",
      students: 24,
      teachers: 2,
    });
    setMarkdown(initialDraft);
    setLoading(false);
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">문서 생성 환경 구성 중...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 
        상단 헤더 
        print:hidden을 통해 인쇄 시에는 이 영역이 출력되지 않도록 함
      */}
      <header className="print:hidden sticky top-0 z-40 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            장소 상세로 돌아가기
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">기본 안전 계획서 미리보기 및 조율</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">교육청 규정에 최적화된 행정 문서가 생성되었습니다.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold border-slate-300 text-slate-700">
            <Save className="w-4 h-4 mr-2" />
            수정사항 임시저장
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md px-6">
            <Printer className="w-4 h-4 mr-2" />
            PDF 인쇄 / 다운로드
          </Button>
        </div>
      </header>

      {/* 
        메인 콘텐츠 영역 (Split View) 
        print 레이아웃 처리는 아래 컨테이너들에 정의 
      */}
      <main className="flex-1 flex overflow-hidden print:overflow-visible">
        
        {/* 
          좌측 뷰 (A4 렌더링 영역) 
          print 시 이 영역만 전체 화면을 차지하도록 설정
        */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-y-auto print:overflow-visible print:bg-white print:w-full print:block">
          <div className="print:hidden p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 sticky top-0">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <FileText className="w-4 h-4 text-emerald-600" />
              행정 품의서 최종 렌더링
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              인쇄 규격 A4 표준
            </span>
          </div>

          <div className="p-8 flex justify-center print:p-0 print:block">
            {/* A4 용지 스타일 컨테이너 */}
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl p-[20mm] print:w-full print:min-h-0 print:shadow-none print:p-0">
              <article className="prose prose-slate max-w-none prose-headings:border-b-0 prose-h1:text-center prose-h1:text-2xl prose-h1:mb-8 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-p:my-2 prose-p:leading-relaxed prose-li:my-1 prose-table:w-full prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-table:border prose-th:border prose-td:border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>

        {/* 
          우측 뷰 (마크다운 에디터) 
          print 시 숨김 처리
        */}
        <div className="w-[600px] flex flex-col border-l bg-white print:hidden shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-20 relative">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 sticky top-0">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Edit3 className="w-4 h-4 text-blue-600" />
              계획서 실시간 편집 및 미세조정
            </div>
          </div>
          
          <div className="flex-1 p-4 bg-slate-50">
            <textarea
              className="w-full h-full p-6 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-none bg-white shadow-inner"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="마크다운 형식으로 문서를 작성하세요..."
              spellCheck={false}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
