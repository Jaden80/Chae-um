"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentStore } from '@/store/studentStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useTripStore } from '@/store/tripStore';

export default function MobileGuidePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const { students } = useStudentStore();
  const { principal, teachers } = useSchoolStore();
  const { place } = useTripStore();
  const { getTripLabel } = useTripStore();

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const specialNeedsStudents = students.filter(s => s.hasSpecialNeeds);
  const allStaff = [principal, ...teachers].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50 shadow-md">
        <h1 className="text-xl font-bold">🚑 현장 안전 가이드</h1>
        <p className="text-xs opacity-80 mt-1">{getTripLabel()} - {place?.name || '체험학습 장소'}</p>
      </header>

      <div className="p-4 space-y-6">
        {/* 긴급 연락처 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2">
            <span className="text-red-500 font-bold">🚨</span>
            <h2 className="font-bold text-red-700">비상 연락망 (원터치)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {allStaff.map((staff, idx) => staff && (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{staff.name}</p>
                  <p className="text-xs text-slate-500">{staff.position}</p>
                </div>
                <a href={`tel:${staff.phone}`} className="bg-blue-100 text-blue-700 p-2 rounded-full shadow-sm active:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* 요양호 학생 명단 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-amber-50 p-3 border-b border-amber-100 flex items-center gap-2">
            <span className="text-amber-500 font-bold">⚠️</span>
            <h2 className="font-bold text-amber-700">요양호 학생 현황 ({specialNeedsStudents.length}명)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {specialNeedsStudents.length > 0 ? specialNeedsStudents.map((student, idx) => (
              <div key={idx} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm">{student.grade}학년 {student.className}반 {student.name}</p>
                  <a href={`tel:${student.parentPhone}`} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-semibold border border-blue-100">
                    보호자 통화
                  </a>
                </div>
                <p className="text-xs text-slate-500">특이사항: {student.specialNeedsDetail || '없음'}</p>
              </div>
            )) : (
               <div className="p-4 text-center text-sm text-slate-400">요양호 학생이 없습니다.</div>
            )}
          </div>
        </section>

        {/* 체크리스트 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✅</span>
            <h2 className="font-bold text-emerald-700">출발 전 안전 점검</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              '차량 운전자 음주 감지 여부 확인',
              '전 좌석 안전벨트 착용 확인',
              '요양호 학생 멀미약/비상약 소지 확인',
              '학생 인원 파악 완료'
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3">
                <input type="checkbox" className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                <span className="text-sm text-slate-700 leading-tight">{item}</span>
              </label>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
