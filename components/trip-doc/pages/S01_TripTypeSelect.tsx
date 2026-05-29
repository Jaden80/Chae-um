import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/tripStore';
import { useDocumentStore } from '@/store/documentStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useStudentStore } from '@/store/studentStore';
import type { TripType, TripScale } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Badge from '@/components/trip-doc/common/Badge';

interface TripTypeCard {
  type: TripType; label: string; description: string;
  scales: { value: TripScale; label: string; desc: string }[];
  features: string[]; docCount: number; color: string;
}

const CARDS: TripTypeCard[] = [
  { type: 'day',      label: '1일형 현장체험학습', description: '당일 출발·귀교하는 체험학습',
    scales: [{ value:'small',label:'소규모',desc:'1~2학급' },{ value:'medium',label:'중규모',desc:'3~6학급' },{ value:'large',label:'대규모',desc:'7학급 이상' }],
    features: ['학부모 동의서','안전 계획서','세부 일정표','비상연락체계표'], docCount: 9, color: 'border-blue-200 hover:border-blue-400' },
  { type: 'training', label: '수련활동', description: '숙박형 체험학습 (수련원·야영 등)',
    scales: [{ value:'small',label:'소규모',desc:'1~2학급' },{ value:'medium',label:'중규모',desc:'3~6학급' },{ value:'large',label:'대규모',desc:'7학급 이상' }],
    features: ['소위원회 회의록','학운위 의안','숙박 배정표','식단 계획표'], docCount: 14, color: 'border-green-200 hover:border-green-400' },
  { type: 'tour',     label: '수학여행', description: '중·대규모 숙박형 수학여행',
    scales: [{ value:'medium',label:'중규모',desc:'3~6학급' },{ value:'large',label:'대규모',desc:'7학급 이상' }],
    features: ['운영 신고서','예산 계획서','야간 지도 계획','결과 보고서'], docCount: 14, color: 'border-purple-200 hover:border-purple-400' },
];

export default function S01_TripTypeSelect() {
  const router = useRouter();
  const selectTripType = useTripStore((s) => s.selectTripType);
  const setCurrentStep = useTripStore((s) => s.setCurrentStep);
  const completeStep   = useTripStore((s) => s.completeStep);
  const resetTrip      = useTripStore((s) => s.resetAll);
  
  const initDocuments  = useDocumentStore((s) => s.initDocuments);
  const resetDocs      = useDocumentStore((s) => s.resetAll);
  
  const isApiReady     = useSettingsStore((s) => s.isAllRequiredApiReady());
  
  const selectSchool   = useSchoolStore((s) => s.selectSchool);
  const resetSchool    = useSchoolStore((s) => s.resetAll);
  
  const clearStudents  = useStudentStore((s) => s.clearStudents);

  const [selected, setSelected] = useState<{ type: TripType; scale: TripScale } | null>(null);

  const handleReset = () => {
    if (window.confirm("입력한 모든 정보와 생성된 문서가 삭제됩니다. 초기화하시겠습니까?")) {
      resetTrip();
      resetDocs();
      resetSchool();
      clearStudents();
      setSelected(null);
    }
  };

  const handleNext = () => {
    if (!selected) return;
    selectTripType(selected.type, selected.scale);
    initDocuments(selected.type);

    // safety-pick 교사 프로필에서 학교 정보 로드 및 설정
    try {
      const saved = localStorage.getItem("safety_pick_teacher_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.schoolName) {
          selectSchool({
            atptOfcdcScCode: "M10",
            sdSchulCode: "mock-school-code",
            schulNm: profile.schoolName,
            schulKndScCode: "02",
            schulKndScNm: "초등학교",
            lctnScCode: "M10",
            lctnScNm: "세종특별자치시",
            juOrgNm: "세종특별자치시교육청",
            orgRdnma: profile.schoolAddress || "세종특별자치시",
            telNo: "044-000-0000",
            atptOfcdcScNm: "세종특별자치시교육청",
          });
        }
      }
    } catch (e) {
      console.error("Failed to load school profile", e);
    }

    completeStep(1);
    completeStep(2); // Step 2 (학교 검색) 자동 완료 처리
    setCurrentStep(3);
    router.push('/doc-wizard/step/excel');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 1 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">체험학습 유형 선택</h1>
        <p className="text-sm text-neutral-500 mt-1">유형과 규모를 선택하면 필요한 서류 목록이 자동으로 결정됩니다.</p>
      </div>

      {!isApiReady && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
          <span className="font-medium">필수 API Key 미설정</span> — NEIS·Gemini API Key를 설정해야 서류 자동 생성이 가능합니다.
          <button onClick={() => router.push('/doc-wizard/settings')} className="ml-2 text-amber-700 underline text-xs">환경설정으로 이동</button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {CARDS.map((card) => (
          <div key={card.type} className={`card border-2 transition-all ${card.color} ${selected?.type === card.type ? 'border-blue-500 bg-blue-50/30' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div><h3 className="font-bold text-neutral-900">{card.label}</h3><p className="text-sm text-neutral-500">{card.description}</p></div>
              <Badge variant="info">{card.docCount}종 서류</Badge>
            </div>
            <div className="mb-3">
              <p className="text-xs font-medium text-neutral-500 mb-2">규모 선택</p>
              <div className="flex gap-2 flex-wrap">
                {card.scales.map((scale) => (
                  <button key={scale.value} onClick={() => setSelected({ type: card.type, scale: scale.value })}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                      selected?.type === card.type && selected?.scale === scale.value
                        ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700 border-neutral-300 hover:border-blue-400'}`}>
                    <span className="font-semibold">{scale.label}</span>
                    <span className="text-xs ml-1 opacity-75">({scale.desc})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.features.map((f) => <span key={f} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">{f}</span>)}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md animate-fade-in">
          <p className="text-sm font-medium text-blue-700">
            선택됨: {CARDS.find((c) => c.type === selected.type)?.label} ·{' '}
            {CARDS.find((c) => c.type === selected.type)?.scales.find((s) => s.value === selected.scale)?.label}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button onClick={handleReset} variant="outline" size="lg" className="text-red-500 border-red-200 hover:bg-red-50"
          icon={<svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}>
          전체 초기화
        </Button>
        <Button onClick={handleNext} disabled={!selected} size="lg"
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
          다음 단계
        </Button>
      </div>
    </div>
  );
}
