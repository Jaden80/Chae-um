import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/tripStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fetchWeatherForecast, getKakaoRoute, searchNearbyHospitals } from '@/utils/apiClient';
import { latLngToGrid } from '@/utils/weatherGrid';
import type { WeatherInfo, RouteInfo, Hospital } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Badge from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';

type CollectItem = 'weather' | 'route' | 'hospital';
type CollectSt   = 'idle' | 'loading' | 'done' | 'error' | 'skipped';

export default function S05_AutoCollect() {
  const router = useRouter();
  const toast    = useToast();
  const { place, plan, route, setRoute, setWeather, setCollectingRoute, setCollectingWeather, completeStep, setCurrentStep } = useTripStore();
  const { settings } = useSettingsStore();
  const [statuses, setStatuses] = useState<Record<CollectItem, { status: CollectSt; message: string }>>({
    weather:  { status: 'idle', message: '날씨 정보 수집 대기' },
    route:    { status: 'idle', message: '경로 정보 수집 대기' },
    hospital: { status: 'idle', message: '인근 병원 수집 대기' },
  });
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [weather,   setLocalWeather] = useState<WeatherInfo[]>([]);
  const [isAllDone, setIsAllDone] = useState(false);

  const setSt = (key: CollectItem, status: CollectSt, message: string) =>
    setStatuses((prev) => ({ ...prev, [key]: { status, message } }));

  const collectWeather = async () => {
    if (!settings.weather.key) { setSt('weather', 'skipped', 'API Key 미설정 (건너뜀)'); return; }
    setSt('weather', 'loading', '기상청 API 호출 중...'); setCollectingWeather(true);
    try {
      const { nx, ny } = latLngToGrid(place!.latitude, place!.longitude);
      const targetDate = plan.startDate?.replace(/-/g, '') ?? '';
      const res  = await fetchWeatherForecast(nx, ny, targetDate);
      const items = (res as any)?.weatherSummary ?? [];
      const data: WeatherInfo[] = items.map((item: any) => ({
        date: item.date, time: item.time, temperature: item.temperature,
        sky: item.sky, precipitation: item.precipitation,
        precipitationProbability: item.precipitationProbability,
        windSpeed: item.windSpeed, humidity: item.humidity,
      }));
      setWeather(data); setLocalWeather(data);
      setSt('weather', 'done', `${data.length}시간 예보 수집 완료`);
    } catch (err) { setSt('weather', 'error', err instanceof Error ? err.message : '날씨 수집 실패'); }
    finally { setCollectingWeather(false); }
  };

  const collectRoute = async () => {
    if (!settings.kakao.key) { setSt('route', 'skipped', 'API Key 미설정 (건너뜀)'); return; }
    setSt('route', 'loading', '카카오 모빌리티 경로 계산 중...'); setCollectingRoute(true);
    try {
      const result = await getKakaoRoute({ originLat: place!.latitude + 0.5, originLng: place!.longitude + 0.5,
        destLat: place!.latitude, destLng: place!.longitude });
      const routeInfo: RouteInfo = { from: '학교', to: place!.address,
        distance: Math.round(result.distance / 1000), duration: Math.round(result.duration / 60) };
      setRoute(routeInfo);
      setSt('route', 'done', `약 ${routeInfo.distance}km / ${routeInfo.duration}분`);
    } catch (err) { setSt('route', 'error', err instanceof Error ? err.message : '경로 수집 실패'); }
    finally { setCollectingRoute(false); }
  };

  const collectHospitals = async () => {
    if (!settings.kakao.key) { setSt('hospital', 'skipped', 'API Key 미설정 (건너뜀)'); return; }
    setSt('hospital', 'loading', '인근 응급실 검색 중...');
    try {
      const res = await searchNearbyHospitals(place!.latitude, place!.longitude, 15_000);
      const list: Hospital[] = res.documents.slice(0, 5).map((d) => ({
        name: d.place_name, address: d.road_address_name || d.address_name,
        phone: d.phone || '-', distance: Math.round(parseFloat(d.distance) / 100) / 10,
        isEmergency: d.place_name.includes('응급'),
      }));
      setHospitals(list);
      if (route) setRoute({ ...route, nearbyHospitals: list });
      setSt('hospital', 'done', `${list.length}개 의료기관 발견`);
    } catch (err) { setSt('hospital', 'error', err instanceof Error ? err.message : '병원 수집 실패'); }
  };

  const handleCollectAll = async () => {
    if (!place) { toast.warning('장소 정보가 없습니다.'); return; }
    await Promise.allSettled([collectWeather(), collectRoute(), collectHospitals()]);
    setIsAllDone(true); toast.success('자동 수집 완료');
  };

  const stBadge = (s: CollectSt) => {
    const m = { idle:{v:'default' as const,t:'대기'}, loading:{v:'info' as const,t:'수집 중'},
                done:{v:'success' as const,t:'완료'}, error:{v:'danger' as const,t:'오류'}, skipped:{v:'warning' as const,t:'건너뜀'} };
    const { v, t } = m[s]; return <Badge variant={v} dot>{t}</Badge>;
  };

  const items = [
    { key:'weather' as CollectItem, label:'날씨 예보', desc:'목적지 주변 기상 예보 (기상청)' },
    { key:'route'   as CollectItem, label:'이동 경로', desc:'학교 → 목적지 소요 시간 (카카오 모빌리티)' },
    { key:'hospital'as CollectItem, label:'인근 의료기관', desc:'목적지 15km 이내 응급실·병원 (카카오)' },
  ];

  const isLoading = Object.values(statuses).some((s) => s.status === 'loading');

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 4 / 8</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">자동 데이터 수집</h1>
        <p className="text-sm text-neutral-500 mt-1">API를 통해 날씨·경로·의료기관 정보를 자동 수집합니다.</p>
      </div>

      {place && (
        <div className="card mb-4 bg-neutral-50">
          <p className="text-xs text-neutral-500 mb-1">수집 대상 장소</p>
          <p className="text-sm font-semibold">{place.name}</p>
          <p className="text-xs text-neutral-500">{place.address}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map(({ key, label, desc }) => {
          const s = statuses[key];
          return (
            <div key={key} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5"><p className="text-sm font-semibold">{label}</p>{stBadge(s.status)}</div>
                  <p className="text-xs text-neutral-500">{desc}</p>
                  <p className="text-xs text-neutral-600 mt-1">{s.message}</p>
                </div>
                {s.status === 'loading' && <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full shrink-0 mt-1" />}
                {s.status === 'done'    && <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          );
        })}
      </div>

      {weather.length > 0 && (
        <div className="card mb-4">
          <p className="text-xs font-semibold text-neutral-400 mb-2">날씨 예보 미리보기</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-neutral-500 border-b border-neutral-200">
                <th className="text-left py-1 pr-3">시간</th><th className="text-left py-1 pr-3">날씨</th>
                <th className="text-right py-1 pr-3">기온</th><th className="text-right py-1">강수확률</th>
              </tr></thead>
              <tbody>
                {weather.slice(0, 6).map((w, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="py-1 pr-3 text-neutral-600">{w.time}</td>
                    <td className="py-1 pr-3 text-neutral-700">{w.sky}</td>
                    <td className="py-1 pr-3 text-right font-mono">{w.temperature}°C</td>
                    <td className="py-1 text-right font-mono">{w.precipitationProbability}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hospitals.length > 0 && (
        <div className="card mb-4">
          <p className="text-xs font-semibold text-neutral-400 mb-2">인근 의료기관</p>
          <ul className="space-y-1.5">
            {hospitals.map((h, i) => (
              <li key={i} className="flex justify-between text-xs">
                <span className="text-neutral-800 font-medium">{h.name}</span>
                <span className="text-neutral-500">{h.distance}km</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/place')}>이전</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCollectAll} loading={isLoading} disabled={isLoading}>자동 수집 실행</Button>
          <Button onClick={() => { completeStep(5); setCurrentStep(6); router.push('/doc-wizard/step/input'); }}
            iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
            {isAllDone ? '다음 단계' : '건너뛰고 계속'}
          </Button>
        </div>
      </div>
    </div>
  );
}
