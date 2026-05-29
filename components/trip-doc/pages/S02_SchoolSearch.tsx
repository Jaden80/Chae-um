import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/store/schoolStore';
import { useTripStore } from '@/store/tripStore';
import { useSettingsStore } from '@/store/settingsStore';
import { searchSchools, fetchClasses } from '@/utils/apiClient';
import type { School } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Input from '@/components/trip-doc/common/Input';
import Badge from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';

export default function S02_SchoolSearch() {
  const router = useRouter();
  const toast    = useToast();
  const { searchResults, isSearching, searchError, selectedSchool, classes, isLoadingClasses,
    staffLoadedAt, setSearchResults, setSearching, setSearchError, selectSchool, setClasses, setLoadingClasses } = useSchoolStore();
  const { completeStep, setCurrentStep } = useTripStore();
  const { settings } = useSettingsStore();
  const [keyword, setKeyword]   = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (keyword.trim().length < 2) { toast.warning('학교명은 2자 이상 입력하세요.'); return; }
    if (!settings.neis.key) { toast.error('NEIS API Key가 설정되지 않았습니다.'); return; }
    setSearching(true); setHasSearched(true);
    try {
      const results = await searchSchools({ keyword: keyword.trim(), pageSize: 20 });
      setSearchResults(results, keyword.trim());
      if (results.length === 0) toast.info('검색 결과가 없습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '검색 실패';
      setSearchError(msg); toast.error(msg);
    }
  }, [keyword, settings.neis.key, setSearching, setSearchResults, setSearchError, toast]);

  const handleSelectSchool = async (school: School) => {
    selectSchool(school); setLoadingClasses(true);
    try {
      const cls = await fetchClasses(school.atptOfcdcScCode, school.sdSchulCode, settings.schoolYear);
      setClasses(cls); toast.success(`${school.schulNm} 학급 정보를 불러왔습니다.`);
    } catch { setClasses([]); toast.warning('학급 정보를 불러오지 못했습니다. 엑셀 업로드로 보완하세요.'); }
  };

  const handleNext = () => {
    if (!selectedSchool) { toast.warning('학교를 선택하세요.'); return; }
    completeStep(2); setCurrentStep(3); router.push('/doc-wizard/step/excel');
  };

  const typeBadge = (t: string) => {
    if (t.includes('초')) return <Badge variant="success">초</Badge>;
    if (t.includes('중')) return <Badge variant="primary">중</Badge>;
    if (t.includes('고')) return <Badge variant="warning">고</Badge>;
    return <Badge>{t}</Badge>;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 2 / 9</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">학교 검색</h1>
        <p className="text-sm text-neutral-500 mt-1">NEIS Open API로 전국 학교를 검색합니다.</p>
      </div>

      <div className="card mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="학교명 입력 (예: 경남중학교)"
              iconLeft={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
          </div>
          <Button onClick={handleSearch} loading={isSearching} disabled={keyword.trim().length < 2}>검색</Button>
        </div>
        {searchError && <p className="text-xs text-red-500 mt-2">{searchError}</p>}
      </div>

      {hasSearched && !isSearching && (
        <div className="card mb-4">
          <p className="text-xs font-semibold text-neutral-400 mb-3">검색 결과 ({searchResults.length}건)</p>
          {searchResults.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">검색 결과가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {searchResults.map((school) => (
                <li key={`${school.atptOfcdcScCode}-${school.sdSchulCode}`}>
                  <button onClick={() => handleSelectSchool(school)}
                    className={`w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-neutral-50
                      ${selectedSchool?.sdSchulCode === school.sdSchulCode ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <div className="flex items-center gap-2">
                      {typeBadge(school.schulKndScNm)}
                      <span className="text-sm font-semibold text-neutral-900">{school.schulNm}</span>
                      {selectedSchool?.sdSchulCode === school.sdSchulCode && (
                        <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-neutral-500">{school.atptOfcdcScNm}</span>
                      <span className="text-xs text-neutral-400">{school.orgRdnma}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedSchool && (
        <div className="card mb-4 border-blue-200 bg-blue-50/30 animate-fade-in">
          <p className="text-xs font-semibold text-blue-600 mb-2">선택된 학교</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div><span className="text-neutral-500">학교명</span><span className="ml-2 font-semibold">{selectedSchool.schulNm}</span></div>
            <div><span className="text-neutral-500">종류</span><span className="ml-2">{selectedSchool.schulKndScNm}</span></div>
            <div><span className="text-neutral-500">교육청</span><span className="ml-2">{selectedSchool.atptOfcdcScNm}</span></div>
            <div><span className="text-neutral-500">전화</span><span className="ml-2">{selectedSchool.telNo}</span></div>
            <div className="col-span-2"><span className="text-neutral-500">주소</span><span className="ml-2">{selectedSchool.orgRdnma}</span></div>
          </div>
          {isLoadingClasses ? (
            <p className="text-xs text-neutral-400 mt-2">학급 정보 불러오는 중...</p>
          ) : classes.length > 0 ? (
            <p className="text-xs text-neutral-500 mt-2">
              학급 수: <span className="font-semibold">{classes.length}학급</span>
              {' ('}
              {[...new Set(classes.map((c) => c.grade))].sort().join(' · ')}
              {' 학년)'}
            </p>
          ) : (
            <p className="text-xs text-neutral-400 mt-2">학급 정보 없음 — 엑셀 업로드로 입력 가능합니다.</p>
          )}
        </div>
      )}

      {staffLoadedAt && (
        <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
          이전에 등록한 교직원 정보가 있습니다 ({new Date(staffLoadedAt).toLocaleDateString('ko-KR')}).
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/type')}>이전</Button>
        <Button onClick={handleNext} disabled={!selectedSchool}
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
          다음 단계
        </Button>
      </div>
    </div>
  );
}
