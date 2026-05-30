import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/tripStore';
import { searchKakaoPlaces } from '@/utils/apiClient';
import type { TripPlace } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Input from '@/components/trip-doc/common/Input';
import Badge from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';
import { useSettingsStore } from '@/store/settingsStore';

export default function S04_PlaceInfo() {
  const router = useRouter();
  const toast    = useToast();
  const { place, setPlace, completeStep, setCurrentStep } = useTripStore();
  const { settings } = useSettingsStore();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<TripPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAddr, setManualAddr] = useState('');

  const handleKakaoSearch = async () => {
    if (!keyword.trim()) { toast.warning('장소명을 입력하세요.'); return; }
    setSearching(true);
    try {
      const res = await searchKakaoPlaces({ keyword: keyword.trim() });
      const places: TripPlace[] = res.documents.map((d) => ({
        placeId: d.id, name: d.place_name, address: d.road_address_name || d.address_name,
        category: d.category_name, latitude: parseFloat(d.y), longitude: parseFloat(d.x),
        phone: d.phone || undefined, sourceApp: 'manual' as const,
      }));
      setResults(places);
      if (places.length === 0) toast.info('검색 결과가 없습니다.');
    } catch (err) { toast.error(err instanceof Error ? err.message : '검색 실패'); }
    finally { setSearching(false); }
  };

  const handleManualSet = () => {
    if (!manualName.trim()) { toast.warning('장소명을 입력하세요.'); return; }
    const manual: TripPlace = {
      placeId: `manual_${Date.now()}`,
      name: manualName.trim(),
      address: manualAddr.trim() || '주소 미입력',
      category: '체험학습 장소',
      latitude: 37.5,
      longitude: 127.0,
      sourceApp: 'manual' as const,
    };
    setPlace(manual);
    toast.success(`"${manual.name}" 장소로 설정되었습니다.`);
    setManualMode(false);
  };

  const handleNext = () => {
    if (!place) { toast.warning('장소를 선택하거나 직접 입력하세요.'); return; }
    completeStep(4);
    completeStep(5);
    setCurrentStep(6);
    router.push('/doc-wizard/step/input');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 3 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">장소 정보</h1>
        <p className="text-sm text-neutral-500 mt-1">체험학습 장소를 선택합니다.</p>
      </div>

      {/* 카카오 장소 검색 */}
      <div className="card mb-4">
        <p className="text-xs font-semibold text-neutral-400 mb-3">🔍 카카오 장소 검색</p>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleKakaoSearch(); }}
              placeholder="체험학습 장소명 검색 (예: 국립중앙박물관)"
            />
          </div>
          <Button onClick={handleKakaoSearch} loading={searching} disabled={!keyword.trim()}>검색</Button>
        </div>

        {results.length > 0 && (
          <ul className="divide-y divide-neutral-100 max-h-64 overflow-y-auto mb-3">
            {results.map((p) => (
              <li key={p.placeId}>
                <button
                  onClick={() => { setPlace(p); toast.success(`${p.name} 선택됨`); }}
                  className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-neutral-50 transition-colors ${
                    place?.placeId === p.placeId ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    {place?.placeId === p.placeId && <Badge variant="primary" size="sm">선택됨</Badge>}
                  </div>
                  <p className="text-xs text-neutral-500">{p.address}</p>
                  <p className="text-xs text-neutral-400">{p.category}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 직접 입력 토글 */}
        <div className="pt-3 border-t border-neutral-100">
          <button
            onClick={() => setManualMode(!manualMode)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            {manualMode ? '▲ 닫기' : '▼ 카카오 검색 없이 직접 입력'}
          </button>
          {manualMode && (
            <div className="mt-3 space-y-2">
              <Input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="장소명 (예: 경복궁, 국립과학관)"
              />
              <Input
                value={manualAddr}
                onChange={(e) => setManualAddr(e.target.value)}
                placeholder="주소 (선택 입력, 예: 서울 종로구 사직로 161)"
              />
              <Button variant="secondary" onClick={handleManualSet} disabled={!manualName.trim()}>
                이 장소로 설정
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 선택된 장소 표시 */}
      {place && (
        <div className="card mb-4 border-blue-200 bg-blue-50/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1">선택된 장소</p>
              <p className="text-sm font-bold">{place.name}</p>
              <p className="text-xs text-neutral-500">{place.address}</p>
            </div>
            <Badge variant="info">{place.sourceApp === 'manual' ? '직접 입력' : '카카오 검색'}</Badge>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/excel')}>이전</Button>
        <Button
          onClick={handleNext}
          disabled={!place}
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
        >
          다음 단계
        </Button>
      </div>
    </div>
  );
}
