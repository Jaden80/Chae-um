import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/tripStore';
import { useStudentStore } from '@/store/studentStore';
import Button from '@/components/trip-doc/common/Button';
import Input from '@/components/trip-doc/common/Input';
import { useToast } from '@/components/trip-doc/common/Toast';

export default function S06_ManualInput() {
  const router = useRouter();
  const toast    = useToast();
  const { plan, place, updatePlan, tripType, completeStep, setCurrentStep } = useTripStore();
  const { summary: studentSummary } = useStudentStore();
  const isOvernight = tripType !== 'day';

  const [form, setForm] = useState({
    title:                plan.title                ?? '',
    purpose:              plan.purpose              ?? '',
    startDate:            plan.startDate            ?? '',
    endDate:              plan.endDate              ?? '',
    departureTime:        plan.departureTime        ?? '09:00',
    returnTime:           plan.returnTime           ?? '16:00',
    totalStudents:        plan.totalStudents        ?? 0,
    nonParticipants:      plan.nonParticipants      ?? 0,
    specialNeedsStudents: plan.specialNeedsStudents ?? 0,
    subsidyStudents:      plan.subsidyStudents      ?? 0,
    budget:               plan.budget               ?? 0,
    transportType:        plan.transportType        ?? 'bus',
    accommodationName:    plan.accommodationName    || (isOvernight && place ? place.name : ''),
    accommodationAddress: plan.accommodationAddress || (isOvernight && place ? place.address : ''),
    accommodationPhone:   plan.accommodationPhone   || (isOvernight && place ? (place.phone || '') : ''),
  });

  const set = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  React.useEffect(() => {
    if (!form.startDate) {
      const savedDate = localStorage.getItem('safety_pick_trip_date');
      if (savedDate) {
        set('startDate', savedDate);
      }
    }
  }, []);

  const getDayOfWeekShort = (dateStr: string) => {
    if (!dateStr) return '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return days[date.getDay()];
  };

  const DateInputWithDay = ({ label, value, onChange, required = false }: any) => {
    const displayValue = value ? `${value}(${getDayOfWeekShort(value)})` : '';
    return (
      <div className="relative group">
        <Input label={label} required={required} value={displayValue} readOnly placeholder="날짜 선택"
          className="cursor-pointer bg-white group-hover:border-blue-400 transition-colors"
          iconRight={<svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <input type="date" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={value} onChange={onChange} onClick={(e) => e.currentTarget.showPicker?.()} />
      </div>
    );
  };


  const handleNext = () => {
    if (!form.startDate) { toast.warning('출발일은 필수입니다.'); return; }
    updatePlan(form as any);
    completeStep(6); setCurrentStep(7); router.push('/doc-wizard/step/generate');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 4 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">추가 정보 입력</h1>
        <p className="text-sm text-neutral-500 mt-1">API로 수집되지 않는 항목을 직접 입력합니다.</p>
      </div>

      <div className="card mb-4 space-y-4">
        <h3 className="font-semibold text-sm">기본 정보</h3>
        <Input label="체험학습 제목" value={form.title} onChange={(e) => set('title', e.target.value)}
          placeholder="예: 2026학년도 현장체험학습" />
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">목적</label>
          <textarea value={form.purpose} onChange={(e) => set('purpose', e.target.value)}
            rows={3} className="input-base resize-none" placeholder="체험학습 목적 및 기대 효과를 입력하세요." />
        </div>
      </div>

      <div className="card mb-4 space-y-4">
        <h3 className="font-semibold text-sm">일정</h3>
        <div className="grid grid-cols-2 gap-3">
          <DateInputWithDay label={isOvernight ? '출발일' : '체험학습 일자'} required value={form.startDate} onChange={(e: any) => set('startDate', e.target.value)} />
          {isOvernight && <DateInputWithDay label="귀교일" value={form.endDate} onChange={(e: any) => set('endDate', e.target.value)} />}
          <Input label="출발 시각" type="time" value={form.departureTime} onChange={(e) => set('departureTime', e.target.value)} />
          <Input label="귀교 시각" type="time" value={form.returnTime} onChange={(e) => set('returnTime', e.target.value)} />
        </div>
      </div>

      <div className="card mb-4 space-y-4">
        <h3 className="font-semibold text-sm">학생 현황 <span className="text-xs text-neutral-500 font-normal ml-2">(Step 2 엑셀 데이터 자동 연동)</span></h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="전체 학생 수" readOnly value={`${studentSummary?.total || 0}명`} className="bg-neutral-50 text-neutral-500" />
          <Input label="미참가 학생 수" readOnly value={`${studentSummary?.nonParticipating || 0}명`} className="bg-neutral-50 text-neutral-500" />
          <Input label="요양호 학생 수" readOnly value={`${studentSummary?.specialNeeds || 0}명`} className="bg-neutral-50 text-neutral-500" />
        </div>
      </div>

      <div className="card mb-4 space-y-4">
        <h3 className="font-semibold text-sm">예산 · 이동</h3>
        <Input label="1인당 경비 (원)" type="number" min={0} value={form.budget || ''}
          onChange={(e) => set('budget', parseInt(e.target.value) || 0)}
          hint={`총 예산: ${((form.budget || 0) * (studentSummary?.total || form.totalStudents || 0)).toLocaleString()}원`} />
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">이동수단</label>
          <div className="flex gap-2 flex-wrap">
            {[['walk','도보'],['citybus','시내버스'],['bus','전세버스'],['train','기차'],['flight','항공'],['mixed','복합 이동']].map(([v,l]) => (
              <button key={v} onClick={() => set('transportType', v)}
                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors
                  ${form.transportType === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700 border-neutral-300 hover:border-blue-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isOvernight && (
        <div className="card mb-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">숙박 정보</h3>
          </div>

          <Input label="숙박 시설명" value={form.accommodationName} onChange={(e) => set('accommodationName', e.target.value)} placeholder="예: ○○리조트" />
          <Input label="숙박 시설 주소" value={form.accommodationAddress} onChange={(e) => set('accommodationAddress', e.target.value)} />
          <Input label="숙박 시설 전화" value={form.accommodationPhone} onChange={(e) => set('accommodationPhone', e.target.value)} placeholder="예: 033-000-0000" />
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/place')}>이전</Button>
        <Button onClick={handleNext}
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
          서류 생성 시작
        </Button>
      </div>
    </div>
  );
}
