export interface NeisApiResponse<T> {
  [key: string]: NeisApiBody<T>[] | undefined;
}

export interface NeisApiBody<T> {
  head?: NeisHead[];
  row?: T[];
}

export interface NeisHead {
  list_total_count?: number;
  RESULT?: { CODE: string; MESSAGE: string };
}

export interface NeisSchoolRow {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  ENG_SCHUL_NM: string;
  SCHUL_KND_SC_NM: string;
  LCTN_SC_NM: string;
  JU_ORG_NM: string;
  ORG_RDNMA: string;
  ORG_RDNZC: string;
  ORG_TELNO: string;
}

export interface NeisClassRow {
  AY: string;
  GRADE: string;
  CLASS_NM: string;
  DDDEP_NM: string;
}

export interface KakaoPlaceResponse {
  documents: KakaoPlace[];
  meta: KakaoMeta;
}

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export interface KakaoMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export interface WeatherApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      dataType: string;
      items: { item: WeatherItem[] };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export interface WeatherItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export interface FunctionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface GeminiRequest {
  documentId: string;
  tripPlan: object;
  schoolSnapshot: object;
  placeInfo?: object;
  weatherInfo?: object;
  routeInfo?: object;
}

export interface GeminiResponse {
  documentId: string;
  content: object;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
