"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DocumentPrintPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [schoolName, setSchoolName] = useState("○○초등학교");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/document/basic-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMarkdown(data.content);
            // Deduce masked school name if present
            const firstLine = data.content.split("\n")[0];
            if (firstLine && firstLine.includes("[")) {
              const nameMatch = firstLine.match(/\[(.*?)\]/);
              if (nameMatch && nameMatch[1]) {
                setSchoolName(nameMatch[1]);
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

    fetchPlan();
  }, [eventId]);

  // Trigger print dialog when loading finishes
  useEffect(() => {
    if (!loading && markdown) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, markdown]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">인쇄 표준 A4 파일 인코딩 중...</h2>
      </div>
    );
  }

  return (
    <div className="print-container bg-white text-slate-800 p-12 max-w-[800px] mx-auto space-y-8 font-sans leading-relaxed text-sm">
      {/* Strict Print CSS styling block inside page to isolate print format rules */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
            line-height: 1.6 !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          header {
            margin-top: 15mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          .no-print {
            display: none !important;
          }
        }
        
        /* Styled custom budget table rules */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
      `}</style>

      {/* Floating print command bar (visible only in browser, hidden in printed PDF) */}
      <div className="no-print bg-slate-100 border-b border-slate-200 p-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">A4 PDF 인쇄 / 저장 미리보기</span>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
        >
          인쇄 / PDF로 저장
        </button>
      </div>

      {/* 5. PDF A4 세로 규격 헤더 */}
      <header className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mt-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400">결재인용 행정계획서</span>
          <span className="text-lg font-black text-slate-800">{schoolName}</span>
        </div>
        <div className="border border-slate-400 p-2 text-center text-xs font-bold min-w-[100px] leading-tight">
          대외비 기안문<br />
          제 2026 - ○○○ 호
        </div>
      </header>

      {/* Main Content Body */}
      <main className="space-y-6">
        {markdown.split("\n").map((line, idx) => {
          if (line.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-2xl font-black text-center text-slate-900 py-4 border-b-2 border-dashed border-slate-200">
                {line.replace("# ", "")}
              </h1>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-slate-900 pt-4 border-b border-slate-200 pb-1">
                {line.replace("## ", "")}
              </h2>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-md font-bold text-slate-800 pt-2 pl-2 border-l-4 border-slate-700">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <li key={idx} className="list-disc pl-4 ml-4 font-semibold text-slate-750">
                {line.replace("- ", "")}
              </li>
            );
          }
          if (line.startsWith("|")) {
            const cells = line.split("|").map(c => c.trim()).filter(Boolean);
            if (line.includes("---")) return null;
            return (
              <table key={idx} className="table-auto w-full border border-slate-300 border-collapse">
                <tbody>
                  <tr className="bg-slate-50 border border-slate-300">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-slate-300 p-3 font-semibold text-xs text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            );
          }
          return <p key={idx} className="min-h-[1rem] pl-2 text-slate-750 font-semibold leading-relaxed">{line}</p>;
        })}
      </main>

      {/* Footer: Page Number (- 1 -) */}
      <footer className="pt-12 text-center text-xs font-bold text-slate-400 border-t border-slate-100 flex flex-col gap-2">
        <div>- 1 -</div>
        <div className="text-[10px] uppercase tracking-wider">{schoolName} 현장체험학습 안전관리처</div>
      </footer>
    </div>
  );
}
