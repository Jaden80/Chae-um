// NEIS School Info Types
export interface School {
  ATPT_OFCDC_SC_CODE: string; // 시도교육청코드
  ATPT_OFCDC_SC_NM: string;   // 시도교육청명
  SD_SCH_CODE: string;        // 표준학교코드
  SCHUL_NM: string;           // 학교명
  ENG_SCHUL_NM: string;       // 영문학교명
  SCHUL_KND_SC_NM: string;    // 학교종류명
  LCTN_SC_NM: string;         // 소재지명
  JU_ORG_NM: string;          // 관할조직명
  FNDN_YMD: string;           // 설립일자
  FOAS_MEMRD: string;         // 개교기념일
  INDST_SPECL_CSEL_SCHUL_NM: string; // 산업특수지정고등학교여부
  HS_GNRL_BUSNS_SC_NM: string; // 고등학교일반실업구분명
  SPCLY_PURPS_HS_ORD_NM: string | null; // 특수목적고등학교계열명
  ENE_BFE_SCHUL_NHR_OTPT_YN: string; // 입학전학교증명서출력여부
  DDDEP_HS_SCH_YN: string;    // 주야과정고등학교여부
  HS_COEDU_SC_NM: string;     // 고등학교남녀공학구분명
  ALOP_COOP_VL_YN: string;    // 대안교육위탁기관지정여부
}

export interface SchoolDetail extends School {
  ORG_RDNZC: string;          // 우편번호
  ORG_RDNMA: string;          // 도로명주소
  ORG_RDNDA: string;          // 도로명상세주소
  ORG_TELNO: string;          // 전화번호
  HMPG_ADRES: string;         // 홈페이지주소
  COEDU_SC_NM: string;        // 남녀공학구분명
  ORG_FAXNO: string;          // 팩스번호
}

// KYWA Certified Youth Activity Programs
export interface Program {
  makeSeq: string;            // 인증번호
  progName: string;           // 프로그램명
  organName: string;          // 운영기관명
  stateName: string;          // 시도
  cityName: string;           // 시군구
  validityStartDate: string;  // 인증시작일
  validityEndDate: string;    // 인증종료일
  safetyLevel: string;        // 안전등급
  targetGrade?: string;       // 대상 학년
}

// TAAS Traffic Accidents
export interface AccidentData {
  totalCount: number;
  accidents: Array<{
    occrrnc_dt: string;       // 발생일시
    occrrnc_lc: string;       // 발생장소
    dth_dnv_cnt: number;      // 사망자수
    se_dnv_cnt: number;       // 중상자수
    slt_dnv_cnt: number;      // 경상자수
    inj_dnv_cnt: number;      // 부상신고자수
    lat: number;
    lng: number;
  }>;
}

export interface SchoolZoneData {
  totalCount: number;
  accidents: Array<{
    spot_nm: string;          // 지점명
    occrrnc_cnt: number;      // 발생건수
    caslt_cnt: number;        // 사상자수
    dth_dnv_cnt: number;      // 사망자수
    se_dnv_cnt: number;       // 중상자수
    slt_dnv_cnt: number;      // 경상자수
  }>;
}

// Meteorological Administration Forecast
export interface ForecastItem {
  category: string;           // 자료구분코드
  fcstDate: string;           // 예측일자
  fcstTime: string;           // 예측시간
  fcstValue: string;          // 예보값
  nx: number;
  ny: number;
}

export interface Forecast {
  baseDate: string;
  baseTime: string;
  items: ForecastItem[];
}

export interface DustData {
  dataTime: string;
  pm10Value: string;          // 미세먼지 농도
  pm25Value: string;          // 초미세먼지 농도
  pm10Grade: string;          // 미세먼지 등급
  pm25Grade: string;          // 초미세먼지 등급
}

// Kakao Maps
export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;                  // lng
  y: string;                  // lat
  place_url: string;
  distance?: string;
}
