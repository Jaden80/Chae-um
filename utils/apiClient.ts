import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { FUNCTIONS_BASE_URL } from '@/lib/firebase';
import type { FunctionResponse, KakaoPlaceResponse, WeatherApiResponse, GeminiRequest, GeminiResponse, School, SchoolClass } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { getBaseDateTime } from './weatherGrid';

const createApiClient = (): AxiosInstance => {
  const instance = axios.create({ baseURL: FUNCTIONS_BASE_URL, timeout: 30_000, headers: { 'Content-Type': 'application/json' } });
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const { getRawKey } = useSettingsStore.getState();
    config.headers['x-neis-key']    = getRawKey('neis');
    config.headers['x-gemini-key']  = getRawKey('gemini');
    config.headers['x-kakao-key']   = getRawKey('kakao');
    config.headers['x-weather-key'] = getRawKey('weather');
    config.headers['x-datagov-key'] = getRawKey('dataGovKr');
    return config;
  });
  instance.interceptors.response.use(
    (r) => r,
    (error) => {
      const status = error.response?.status, msg = error.response?.data?.error ?? error.message;
      if (status === 401) throw new Error(`API 인증 오류: ${msg}`);
      if (status === 429) throw new Error('API 호출 한도 초과. 잠시 후 다시 시도하세요.');
      if (!navigator.onLine) throw new Error('인터넷 연결을 확인하세요.');
      throw new Error(msg ?? '알 수 없는 오류가 발생했습니다.');
    }
  );
  return instance;
};

export const apiClient = createApiClient();

const proxyGet = async <T>(endpoint: string, params?: Record<string, unknown>): Promise<T> => {
  const res = await apiClient.get<FunctionResponse<T>>(endpoint, { params });
  if (!res.data.success) throw new Error(res.data.error ?? '요청 실패');
  return res.data.data as T;
};
const proxyPost = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await apiClient.post<FunctionResponse<T>>(endpoint, body);
  if (!res.data.success) throw new Error(res.data.error ?? '요청 실패');
  return res.data.data as T;
};

// NEIS
export const searchSchools = async (p: { keyword: string; pageSize?: number; pageIndex?: number }): Promise<School[]> => {
  const rows = await proxyGet<any[]>('/neis/schools', { keyword: p.keyword, pageSize: p.pageSize ?? 20, pageIndex: p.pageIndex ?? 1 });
  return rows.map((r) => ({
    atptOfcdcScCode: r.ATPT_OFCDC_SC_CODE,
    atptOfcdcScNm: r.ATPT_OFCDC_SC_NM,
    sdSchulCode: r.SD_SCHUL_CODE,
    schulNm: r.SCHUL_NM,
    engSchuNm: r.ENG_SCHUL_NM,
    schulKndScCode: '',
    schulKndScNm: r.SCHUL_KND_SC_NM,
    lctnScCode: '',
    lctnScNm: r.LCTN_SC_NM,
    juOrgNm: r.JU_ORG_NM,
    orgRdnma: r.ORG_RDNMA,
    orgRdnZip: r.ORG_RDNZC,
    telNo: r.ORG_TELNO,
  }));
};

export const fetchClasses = async (atptOfcdcScCode: string, sdSchulCode: string, schoolYear: string): Promise<SchoolClass[]> => {
  const rows = await proxyGet<any[]>('/neis/classes', { atptOfcdcScCode, sdSchulCode, schoolYear });
  return rows.map((r) => ({
    atptOfcdcScCode,
    sdSchulCode,
    AY: r.AY,
    grade: r.GRADE,
    classNm: r.CLASS_NM,
    dddepNm: r.DDDEP_NM,
  }));
};
export const testNeisApiKey = async (key: string) => {
  const r = await apiClient.get<FunctionResponse<boolean>>(`/neis/test?_t=${Date.now()}`, { headers: { 'x-neis-key': key } }); return r.data.success === true;
};

// 카카오
export interface KakaoKeywordParams { keyword: string; lat?: number; lng?: number; radius?: number; categoryGroupCode?: string; page?: number; size?: number; }
export const searchKakaoPlaces = async (p: KakaoKeywordParams) => {
  const res = await axios.get<FunctionResponse<KakaoPlaceResponse>>('/api/kakao/search', {
    params: { keyword: p.keyword, lat: p.lat, lng: p.lng, radius: p.radius ?? 5000, category_group_code: p.categoryGroupCode, page: p.page ?? 1, size: p.size ?? 15 }
  });
  if (!res.data.success) throw new Error(res.data.error ?? '요청 실패');
  return res.data.data as KakaoPlaceResponse;
};
export const searchNearbyHospitals = (lat: number, lng: number, radius = 10_000) =>
  searchKakaoPlaces({ keyword: '응급실', lat, lng, radius, categoryGroupCode: 'HP8' });

export interface RouteParams { originLat: number; originLng: number; destLat: number; destLng: number; waypoints?: { lat: number; lng: number }[]; }
export interface KakaoRouteResult { distance: number; duration: number; tollFare: number; fuelPrice: number; summary: string; path?: { lat: number; lng: number }[]; }
export const getKakaoRoute = async (p: RouteParams) => {
  const res = await axios.post<FunctionResponse<KakaoRouteResult> | any>('/api/directions', p);
  if (res.data.success === false) throw new Error(res.data.error ?? '요청 실패');
  return res.data as KakaoRouteResult;
};
export const testKakaoApiKey = async (key: string) => {
  const r = await apiClient.get<FunctionResponse<boolean>>(`/kakao/test?_t=${Date.now()}`, { headers: { 'x-kakao-key': key } }); return r.data.success === true;
};

// 기상청
export const fetchWeatherForecast = (nx: number, ny: number, targetDate?: string) => {
  const { baseDate, baseTime } = getBaseDateTime();
  return proxyGet<WeatherApiResponse>('/weather/forecast', { nx, ny, baseDate, baseTime, targetDate: targetDate ?? baseDate });
};
export const testWeatherApiKey = async (key: string) => {
  const r = await apiClient.get<FunctionResponse<boolean>>(`/weather/test?_t=${Date.now()}`, { headers: { 'x-weather-key': key } }); return r.data.success === true;
};

// Data.go.kr
export interface TourPlace { contentId: string; title: string; address: string; tel?: string; overview?: string; mapX: string; mapY: string; firstImage?: string; contentTypeId: string; cat1: string; cat2: string; cat3: string; }
export const searchTourPlaces    = (keyword: string, lat?: number, lng?: number, radius?: number) =>
  proxyGet<TourPlace[]>('/datagov/tour', { keyword, lat, lng, radius: radius ?? 5000 });
export const getTourPlaceDetail  = (contentId: string, contentTypeId: string) =>
  proxyGet<TourPlace>('/datagov/tour/detail', { contentId, contentTypeId });
export const testDataGovApiKey   = async (key: string) => {
  const r = await apiClient.get<FunctionResponse<boolean>>(`/datagov/test?_t=${Date.now()}`, { headers: { 'x-datagov-key': key } }); return r.data.success === true;
};

// Gemini
export const generateDocument = (req: GeminiRequest) => proxyPost<GeminiResponse>('/gemini/generate', req);
export const generateDocumentsBatch = async (requests: GeminiRequest[], onProgress?: (c: number, t: number) => void, delayMs = 800) => {
  const results: GeminiResponse[] = [];
  for (let i = 0; i < requests.length; i++) {
    results.push(await generateDocument(requests[i]));
    onProgress?.(i + 1, requests.length);
    if (i < requests.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
};
export const testGeminiApiKey = async (key: string) => {
  const r = await apiClient.post<FunctionResponse<boolean>>('/gemini/test', {}, { headers: { 'x-gemini-key': key } }); return r.data.success === true;
};

import type { ApiProvider } from '@/store/settingsStore';
export const API_TEST_FUNCTIONS: Record<ApiProvider, (key: string) => Promise<boolean>> = {
  neis: testNeisApiKey, gemini: testGeminiApiKey, kakao: testKakaoApiKey,
  weather: testWeatherApiKey, dataGovKr: testDataGovApiKey,
};
