import { Program } from "@/types/api";

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;

// 공공데이터포털 한국청소년활동진흥원_청소년 수련활동 인증프로그램 정보 서비스
// 엔드포인트: http://apis.data.go.kr/B552713/svc004
const BASE_URL = "http://apis.data.go.kr/B552713/svc004/getCrtfPrgmInfo";

/**
 * 시도명(광역시/도) 변환 테이블
 * 학교 주소의 첫 번째 토큰을 API ctpvNm 파라미터에 맞게 변환
 */
function normalizeProvinceName(rawRegion: string): string {
  const map: Record<string, string> = {
    서울: "서울특별시",
    부산: "부산광역시",
    대구: "대구광역시",
    인천: "인천광역시",
    광주: "광주광역시",
    대전: "대전광역시",
    울산: "울산광역시",
    세종: "세종특별자치시",
    경기: "경기도",
    강원: "강원도",
    충북: "충청북도",
    충청북도: "충청북도",
    충남: "충청남도",
    충청남도: "충청남도",
    전북: "전라북도",
    전라북도: "전라북도",
    전남: "전라남도",
    전라남도: "전라남도",
    경북: "경상북도",
    경상북도: "경상북도",
    경남: "경상남도",
    경상남도: "경상남도",
    제주: "제주특별자치도",
  };
  // 정규화된 이름 우선 사용, 없으면 원본 반환
  for (const key of Object.keys(map)) {
    if (rawRegion.startsWith(key)) return map[key];
  }
  return rawRegion;
}

/**
 * 교과 주제/단원 키워드에서 수련활동명 검색어를 생성
 * - 다양한 키워드를 시도하여 검색 결과가 없을 경우 대안 키워드로 재시도
 */
export function buildSearchKeywords(subject: string, unit: string): string[] {
  const keywords: string[] = [];

  // 과목별 1차 키워드
  if (subject.includes("과학")) {
    keywords.push("과학체험", "자연탐구", "생태체험", "환경체험");
  }
  if (subject.includes("사회")) {
    keywords.push("역사탐방", "문화체험", "지역사회", "공동체체험");
  }
  if (subject.includes("국어") || subject.includes("도서")) {
    keywords.push("독서체험", "문학체험", "문화예술");
  }
  if (subject.includes("수학")) {
    keywords.push("수학체험", "창의융합", "과학수학");
  }
  if (subject.includes("미술") || subject.includes("예술")) {
    keywords.push("예술체험", "문화예술", "창작체험");
  }
  if (subject.includes("체육") || subject.includes("안전")) {
    keywords.push("안전체험", "야외활동", "신체활동");
  }

  // 단원 키워드 기반 추가
  if (unit.includes("식물") || unit.includes("생태") || unit.includes("자연") || unit.includes("환경")) {
    keywords.push("생태체험", "자연탐구", "환경교육");
  }
  if (unit.includes("역사") || unit.includes("문화") || unit.includes("유산")) {
    keywords.push("역사문화체험", "문화유산탐방");
  }
  if (unit.includes("안전") || unit.includes("교통") || unit.includes("소방")) {
    keywords.push("안전교육", "재난안전체험");
  }
  if (unit.includes("우주") || unit.includes("천문") || unit.includes("지구")) {
    keywords.push("천문체험", "우주과학");
  }
  if (unit.includes("고장") || unit.includes("지역") || unit.includes("공공")) {
    keywords.push("지역사회탐방", "공공기관견학");
  }
  if (unit.includes("ai") || unit.includes("인공지능") || unit.includes("코딩") || unit.includes("로봇") || unit.includes("첨단") || unit.includes("과학") || unit.includes("컴퓨터") || unit.includes("미래") || unit.includes("소프트웨어") || unit.includes("sw")) {
    keywords.push("과학체험", "창의융합", "정보통신체험", "로봇체험");
  }

  // 중복 제거 후 최대 4개 반환
  return Array.from(new Set(keywords)).slice(0, 4);
}

/**
 * 청소년수련활동 인증프로그램 정보 조회 (공공데이터포털 B552713/svc004)
 * @param params.ctpvNm - 시도명 (예: 세종특별자치시)
 * @param params.sggNm  - 시군구명 (선택)
 * @param params.trnActvNm - 수련활동명 검색어 (선택)
 */
export async function searchCertifiedPrograms(params: {
  region?: string;      // 학교 주소 첫 토큰 (원본)
  sggNm?: string;       // 시군구명 (선택)
  keyword?: string;     // 수련활동명 검색어
}): Promise<Program[]> {
  if (!DATA_GO_KR_API_KEY) {
    console.warn("DATA_GO_KR_API_KEY is not set. Skipping KYWA API call.");
    return [];
  }

  const ctpvNm = normalizeProvinceName(params.region || "세종특별자치시");

  const url = new URL(BASE_URL);
  url.searchParams.append("serviceKey", DATA_GO_KR_API_KEY);
  url.searchParams.append("returnType", "json");
  url.searchParams.append("numOfRows", "30");
  url.searchParams.append("pageNo", "1");
  url.searchParams.append("ctpvNm", ctpvNm);

  if (params.sggNm) {
    url.searchParams.append("sggNm", params.sggNm);
  }
  if (params.keyword) {
    url.searchParams.append("trnActvNm", params.keyword);
  }

  console.log(`[KYWA API] Searching: ctpvNm=${ctpvNm}, keyword=${params.keyword || "전체"}`);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!res.ok) {
      throw new Error(`KYWA API HTTP error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();

    // XML 에러 응답 감지
    if (text.trim().startsWith("<") && text.includes("OpenAPI_ServiceResponse")) {
      console.warn("[KYWA API] Received error XML response:", text.slice(0, 200));
      return [];
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("[KYWA API] Failed to parse JSON:", text.slice(0, 200));
      return [];
    }

    // 응답 구조: response → body → items → item
    const items = data?.response?.body?.items?.item;
    if (!items) {
      console.log("[KYWA API] No items found in response.");
      return [];
    }

    const list: Program[] = Array.isArray(items) ? items : [items];
    console.log(`[KYWA API] Found ${list.length} certified programs.`);

    // Program 인터페이스에 매핑
    return list.map((item: any): Program => ({
      makeSeq: item.makeSeq || item.crtfNo || String(Math.random()),
      progName: item.trnActvNm || item.progName || "미명칭 프로그램",
      organName: item.operInstNm || item.organName || "",
      stateName: item.ctpvNm || params.region || "",
      cityName: item.sggNm || "",
      validityStartDate: item.crtfBgngYmd || item.validityStartDate || "",
      validityEndDate: item.crtfEndYmd || item.validityEndDate || "",
      safetyLevel: item.jdgGd || item.safetyLevel || "",
      targetGrade: item.actTrgetNm || item.targetGrade || "",
    }));
  } catch (error) {
    console.error("[KYWA API] searchCertifiedPrograms error:", error);
    return [];
  }
}

/**
 * 여러 키워드로 순차 검색하여 결과를 합산
 * - 첫 번째 키워드에서 결과가 충분하면 조기 종료
 */
export async function searchCertifiedProgramsMultiKeyword(params: {
  region?: string;
  sggNm?: string;
  keywords: string[];
  minResults?: number;
}): Promise<Program[]> {
  const { keywords, minResults = 5 } = params;
  const allResults: Program[] = [];
  const seenIds = new Set<string>();

  for (const keyword of keywords) {
    if (allResults.length >= minResults) break;

    const results = await searchCertifiedPrograms({
      region: params.region,
      sggNm: params.sggNm,
      keyword,
    });

    for (const prog of results) {
      if (!seenIds.has(prog.makeSeq)) {
        seenIds.add(prog.makeSeq);
        allResults.push(prog);
      }
    }
  }

  // 결과가 여전히 없으면 키워드 없이 지역 전체 검색하는 로직(fallback)은 제거함. 
  // (주제와 전혀 무관한 장소가 대거 유입되어 추천되는 문제 방지)
  
  return allResults;
}
