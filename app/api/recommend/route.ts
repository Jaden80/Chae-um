import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { searchCertifiedProgramsMultiKeyword, buildSearchKeywords } from "@/lib/api/kywa";
import { getAccidentsByArea, getSchoolZoneAccidents } from "@/lib/api/taas";
import { geocode, searchPlaces, getRegionCode } from "@/lib/api/kakao-map";
import { generateJSONRecommendation, generatePlaceDescription } from "@/lib/ai/gemini";

// Helper to check if Supabase env is mocked
function isSupabaseMocked() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("your_supabase");
}

/**
 * 인접한 행정구역(시도 단위) 목록을 반환하는 함수
 */
function getNeighborRegions(region: string): string[] {
  const neighbors: Record<string, string[]> = {
    "세종": ["대전", "충남", "충북"],
    "대전": ["세종", "충남", "충북"],
    "서울": ["경기", "인천"],
    "인천": ["서울", "경기"],
    "경기": ["서울", "인천", "강원", "충북", "충남"],
    "부산": ["울산", "경남"],
    "울산": ["부산", "경북", "경남"],
    "대구": ["경북", "경남"],
    "광주": ["전남", "전북"],
    "강원": ["경기", "충북", "경북"],
    "충북": ["경기", "강원", "충남", "경북", "전북"],
    "충남": ["경기", "세종", "대전", "충북", "전북"],
    "전북": ["충남", "충북", "경북", "전남", "경남"],
    "전남": ["광주", "전북", "경남"],
    "경북": ["대구", "강원", "충북", "전북", "경남", "울산"],
    "경남": ["부산", "울산", "대구", "경북", "전북", "전남"],
    "제주": []
  };

  const key = Object.keys(neighbors).find(k => region.includes(k)) || "세종";
  return neighbors[key] || [];
}

/**
 * 주제(subject) / 단원(unit) / 지역(region) 조합으로
 * 카카오맵 키워드 검색을 사용하여 다양한 체험처를 발굴하기 위한 키워드 세트 생성
 */
function buildKakaoFallbackKeywords(subject: string, unit: string, region: string): string[] {
  const keywords: string[] = [];
  const u = unit.toLowerCase().trim();

  // ── 0단계: 사용자가 입력한 구체적인 주제어 자체를 최우선 검색어로 추가 ──────────
  if (u.length >= 2 && !u.includes("단원") && !u.includes("학기") && !u.includes("차시")) {
    keywords.push(u);
    keywords.push(`${region} ${u}`);
  }

  // ── 1단계: 단원 내용 기반 분류 (과목 무관하게 우선 적용) ──────────
  const isBodyHealth =
    u.includes("몸") || u.includes("신체") || u.includes("건강") ||
    u.includes("뇌") || u.includes("심장") || u.includes("근육") ||
    u.includes("소화") || u.includes("호흡") || u.includes("뼈") ||
    u.includes("혈액") || u.includes("감각") || u.includes("영양") ||
    u.includes("인체") || u.includes("해부") || u.includes("신경");

  const isPlantEcology =
    u.includes("식물") || u.includes("동식물") || u.includes("생태") ||
    u.includes("환경") || u.includes("동물") || u.includes("곤충") ||
    u.includes("꽃") || u.includes("나무") || u.includes("숲");

  const isHistory =
    u.includes("역사") || u.includes("문화재") || u.includes("전통") ||
    u.includes("유적") || u.includes("민주") || u.includes("유물") ||
    u.includes("조선") || u.includes("고려") || u.includes("삼국") || u.includes("독립");

  const isAstronomy =
    u.includes("우주") || u.includes("천체") || u.includes("별") ||
    u.includes("태양계") || u.includes("행성") || u.includes("달");

  const isEconomy =
    u.includes("경제") || u.includes("시장") || u.includes("소비") ||
    u.includes("생산") || u.includes("무역") || u.includes("화폐");

  const isSafety =
    u.includes("안전") || u.includes("소방") || u.includes("재난") ||
    u.includes("응급") || u.includes("구조");

  const isGeology =
    u.includes("지층") || u.includes("화석") || u.includes("지질") ||
    u.includes("암석") || u.includes("광물") || u.includes("지형");

  const isEnergy =
    u.includes("빛") || u.includes("에너지") || u.includes("소리") ||
    u.includes("전기") || u.includes("자석") || u.includes("열") || u.includes("기계");

  const isCommunity =
    u.includes("지역") || u.includes("공공기관") || u.includes("공공") ||
    u.includes("우리 고장") || u.includes("마을") || u.includes("지방");

  const isWater =
    u.includes("물") || u.includes("강") || u.includes("바다") ||
    u.includes("해양") || u.includes("수산") || u.includes("날씨") || u.includes("기후");

  const isArt =
    u.includes("미술") || u.includes("음악") || u.includes("예술") ||
    u.includes("공예") || u.includes("그림") || u.includes("조각");

  const isAgriculture =
    u.includes("농촌") || u.includes("농업") || u.includes("어촌") ||
    u.includes("농사") || u.includes("식량");

  const isAiTech =
    u.includes("ai") || u.includes("인공지능") || u.includes("코딩") ||
    u.includes("로봇") || u.includes("첨단") || u.includes("과학") ||
    u.includes("테크") || u.includes("소프트웨어") || u.includes("sw") ||
    u.includes("it") || u.includes("컴퓨터") || u.includes("미래");

  // ── 2단계: 단원 분류별 키워드 생성 ──────────────────────────────
  if (isBodyHealth) {
    keywords.push(
      `${region} 과학관`, `${region} 어린이과학관`,
      `${region} 인체탐험관`, `${region} 건강체험관`,
      `${region} 의학박물관`, `${region} 과학체험관`
    );
  }
  if (isPlantEcology) {
    keywords.push(
      `${region} 수목원`, `${region} 식물원`,
      `${region} 생태공원`, `${region} 자연학습원`, `${region} 생태체험관`
    );
  }
  if (isHistory) {
    keywords.push(
      `${region} 역사박물관`, `${region} 문화재`,
      `${region} 민속촌`, `${region} 전통문화체험관`, `${region} 유적지`
    );
  }
  if (isAstronomy) {
    keywords.push(
      `${region} 천문대`, `${region} 과학관`,
      `${region} 천문과학관`, `${region} 플라네타리움`
    );
  }
  if (isEconomy) {
    keywords.push(
      `${region} 전통시장`, `${region} 화폐박물관`,
      `${region} 경제체험관`, `${region} 어린이경제체험`
    );
  }
  if (isSafety) {
    keywords.push(
      `${region} 안전체험관`, `${region} 소방체험관`,
      `${region} 시민안전체험관`, `${region} 재난안전체험관`
    );
  }
  if (u.includes("교통")) {
    keywords.push(`${region} 교통안전체험관`, `${region} 교통문화연수원`);
  }
  if (isGeology) {
    keywords.push(
      `${region} 지질박물관`, `${region} 자연사박물관`,
      `${region} 화석체험`, `${region} 지구과학체험`
    );
  }
  if (isEnergy) {
    keywords.push(
      `${region} 에너지체험관`, `${region} 과학관`,
      `${region} 어린이과학관`, `${region} 창의과학체험`
    );
  }
  if (isCommunity) {
    keywords.push(
      `${region} 박물관`, `${region} 역사박물관`,
      `${region} 문화관`, `${region} 지역문화체험`
    );
  }
  if (isWater) {
    keywords.push(
      `${region} 해양박물관`, `${region} 수족관`,
      `${region} 환경체험관`, `${region} 생태공원`
    );
  }
  if (isArt) {
    keywords.push(
      `${region} 미술관`, `${region} 공예체험관`,
      `${region} 문화예술회관`, `${region} 음악당`
    );
  }
  if (isAgriculture) {
    keywords.push(`${region} 농촌체험마을`, `${region} 농경체험`, `${region} 어촌체험마을`);
  }
  if (isAiTech) {
    keywords.push(
      `${region} 테크노파크`, `${region} 로봇체험관`,
      `${region} 과학체험관`, `${region} 창의융합교육원`,
      `${region} SW교육체험`, `${region} 과학관`
    );
  }

  // ── 3단계: 과목 기반 보완 (단원 분류가 비어있을 때) ──────────────
  if (keywords.length === 0) {
    if (subject.includes("과학"))
      keywords.push(`${region} 과학관`, `${region} 어린이과학관`, `${region} 과학체험관`);
    else if (subject.includes("사회"))
      keywords.push(`${region} 박물관`, `${region} 역사박물관`, `${region} 문화체험관`);
    else if (subject.includes("국어"))
      keywords.push(`${region} 도서관`, `${region} 문학관`, `${region} 생가`);
    else if (subject.includes("도덕"))
      keywords.push(`${region} 인성교육체험관`, `${region} 복지관`);
    else if (subject.includes("미술") || subject.includes("음악"))
      keywords.push(`${region} 미술관`, `${region} 문화예술회관`);
    else if (subject.includes("체육") || subject.includes("안전"))
      keywords.push(`${region} 안전체험관`, `${region} 소방서체험`);
    else if (subject.includes("수학"))
      keywords.push(`${region} 수학체험관`, `${region} 창의융합체험관`, `${region} 어린이과학관`);
    else
      keywords.push(
        `${region} 어린이체험관`, `${region} 과학관`,
        `${region} 박물관`, `${region} 문화체험관`
      );
  }

  return Array.from(new Set(keywords)).slice(0, 12);
}

/**
 * 교과 주제/단원과 장소 유형을 조합하여 교육적 연계 설명 동적 생성
 */
function getCustomMatchReason(placeName: string, grade: string, subject: string, unit: string): string {
  // 1. 단원 키워드 추출
  const isPlant = unit.includes("식물") || unit.includes("동식물") || unit.includes("생태") || unit.includes("환경") || unit.includes("꽃") || unit.includes("나무") || unit.includes("곤충") || unit.includes("숲");
  const isHistory = unit.includes("역사") || unit.includes("문화재") || unit.includes("전통") || unit.includes("유적") || unit.includes("조선") || unit.includes("고려") || unit.includes("시대") || unit.includes("선조");
  const isSafety = unit.includes("안전") || unit.includes("교통") || unit.includes("소방") || unit.includes("재난");
  const isCommunity = unit.includes("지역") || unit.includes("공공기관") || unit.includes("공공") || unit.includes("고장") || unit.includes("생활") || unit.includes("우리");
  const isEconomy = unit.includes("경제") || unit.includes("시장") || unit.includes("소비") || unit.includes("화폐");
  const isAstronomy = unit.includes("우주") || unit.includes("천체") || unit.includes("별") || unit.includes("태양계") || unit.includes("달");
  const isGeology = unit.includes("지층") || unit.includes("화석") || unit.includes("지질") || unit.includes("암석") || unit.includes("흙");
  const isEnergy = unit.includes("빛") || unit.includes("에너지") || unit.includes("소리") || unit.includes("전기") || unit.includes("자석") || unit.includes("열");
  const isAiTech = unit.toLowerCase().includes("ai") || unit.includes("인공지능") || unit.includes("코딩") || unit.includes("로봇") || unit.includes("첨단") || unit.includes("컴퓨터") || unit.includes("미래") || unit.includes("소프트웨어") || unit.includes("sw") || unit.includes("과학");

  // 2. 장소 유형 추출
  const isScience = placeName.includes("과학관") || placeName.includes("과학체험") || placeName.includes("자연과학") || placeName.includes("교육원") || placeName.includes("창의융합");
  const isTraditional = placeName.includes("전통") || placeName.includes("문화체험") || placeName.includes("문화원") || placeName.includes("서원") || placeName.includes("향교") || placeName.includes("체험관");
  const isEco = placeName.includes("수목원") || placeName.includes("식물원") || placeName.includes("생태") || placeName.includes("휴양림") || placeName.includes("자연학습") || placeName.includes("공원") || placeName.includes("수림");
  const isHistoryPlace = placeName.includes("역사") || placeName.includes("박물관") || placeName.includes("기념관") || placeName.includes("유적지") || placeName.includes("생가");
  const isSafetyPlace = placeName.includes("안전체험") || placeName.includes("소방") || placeName.includes("교통") || placeName.includes("시민안전");
  const isEconomyPlace = placeName.includes("시장") || placeName.includes("경제") || placeName.includes("화폐");

  // 3. 결합형 시나리오 매칭
  // 과학 교육/체험 공간
  if (isScience) {
    if (isAiTech) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원에서 강조하는 AI 기술, 코딩, 로봇 공학 및 첨단 과학 기기들을 직접 조작하고 체험하며, 미래 첨단 기술에 대한 안목과 창의융합적 탐구력을 극대화할 수 있는 공간입니다.`;
    }
    if (isAstronomy) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원에서 학습하는 천체와 우주, 태양계의 운동을 과학관 내 첨단 영상관과 다양한 관측 시뮬레이션을 통해 직관적으로 배우며 과학적 호기심을 키우기에 최적인 공간입니다.`;
    }
    if (isGeology) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 지층과 화석, 다양한 광물 표본을 눈으로 확인하고, 과학 실험 장비를 통해 지형 형성과 암석의 성질을 흥미롭게 탐구할 수 있는 과학체험 공간입니다.`;
    }
    if (isEnergy) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 핵심 주제인 전기, 자석, 빛과 소리의 성질을 관람형 전시물 및 직접적인 조작 실험을 수행하면서 과학적 탐구력을 기를 수 있는 적합한 장소입니다.`;
    }
    if (isPlant) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 생명체 탐구 주제와 연계하여 동식물의 미세 구조 관찰 및 생명 현상을 시연하는 과학 전시물을 조작하며 자연과학적 사고를 깊게 할 수 있습니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원의 개념들을 직관적인 조작형 과학 전시물을 통해 탐구하고 실험해보며, 교과 원리를 온몸으로 체득하고 과학적 흥미를 극대화할 수 있는 과학 교육 공간입니다.`;
  }

  // 자연 생태 및 수목원 공간
  if (isEco) {
    if (isPlant) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 다양한 식물들의 성장 과정, 잎과 줄기의 구조를 실제 자연환경에서 직접 관찰하고 탐색할 수 있어 생태 감수성을 키우고 교과 목표를 달성하기에 가장 적절한 야외 생태 학습장입니다.`;
    }
    if (isCommunity) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 우리 고장의 친환경 자연 인프라 및 생태계를 온몸으로 체험하고 탐방하며, 자연환경 보존의 필요성과 주민 복지에 기여하는 공공 수목원의 역할을 이해할 수 있는 훌륭한 배움터입니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원과 연계하여 자연 탐방로 걷기 및 친환경 원예 노작 활동을 직접 수행하면서 생태학적 원리와 생명 존중 사상을 체계적으로 학습할 수 있는 자연 친화적 공간입니다.`;
  }

  // 역사박물관 및 전시관
  if (isHistoryPlace) {
    if (isHistory) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원에 등장하는 주요 역사적 사료 및 유물들을 입체적으로 감상하고, 시대별 발전 과정을 한눈에 파악하며 조상들의 발자취와 역사적 사건의 관계를 깊이 있게 이해할 수 있는 전문 박물관입니다.`;
    }
    if (isCommunity) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원에 맞춰 우리 고장의 탄생 유래와 지역 발전의 역사를 보여주는 시각 자료를 조사하며 내 고장에 대한 자긍심과 사회과 탐구 능력을 높일 수 있는 전시 공간입니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원의 교육적 의의를 돕는 풍부한 소장품과 사료를 활용해, 교과서 너머의 구체적인 생활 문화와 역사의 흐름을 생동감 있게 이해할 수 있도록 설계된 박물관입니다.`;
  }

  // 안전/소방/교통
  if (isSafetyPlace) {
    if (isSafety) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원에서 다루는 다양한 일상생활 안전 위험 요소를 인지하고, 재난 시뮬레이터 및 소방 장비 체험을 통해 실제 대처 요령과 위기 극복 능력을 행동으로 각인시키는 안전 전문 학습 공간입니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원의 생활 안전 의식을 실천 중심의 맞춤형 교안과 대피 훈련을 통해 안전에 대한 중요성을 체득할 수 있는 모범 시설입니다.`;
  }

  // 경제 및 시장
  if (isEconomyPlace) {
    if (isEconomy) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 합리적인 소비와 생산자-소비자 간의 관계, 그리고 화폐의 실물 흐름을 시장 상인들과의 교류 및 실물 탐방을 통해 살아있는 현장 경제 교육으로 학습하기에 제격인 체험 시설입니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원의 유통과 경제의 작동 원리를 활기찬 일상 현장 속에서 자연스럽게 파악하고 체험하기에 최적인 경제 중심 학습처입니다.`;
  }

  // 전통 문화 및 체험관 공간 (체험이란 단어가 겹치더라도 전통/체험관 성격에 맞게 융합)
  if (isTraditional) {
    if (isHistory) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 역사적 삶의 모습과 선조들의 슬기를 전통 가옥 관람 및 세시풍속 예절 교육을 통해 생생하게 경험하며 우리 역사에 대한 이해와 애정을 키우기에 제격인 장소입니다.`;
    }
    if (isCommunity) {
      return `본 체험처는 ${grade}학년 [${unit}] 단원의 우리 지역 고유의 문화적 정체성과 전통 생활 도구들을 실물로 접하고, 다양한 체험 활동을 병행하며 인문학적 감수성을 키우는 융합형 문화 체험 공간입니다.`;
    }
    return `본 체험처는 ${grade}학년 [${unit}] 단원의 목표에 부합하는 전통 공예, 서예, 세시풍속 등 실천적 문화 활동을 통하여 조상들의 지혜와 공동체 정신을 배우고 창의성을 함양할 수 있습니다.`;
  }

  // 4. 일반적인 Fallback (특정 카테고리에 매핑되지 않는 Kakao 검색 결과 등의 경우)
  let activityType = "유기적인 탐구 및 현장 실사";
  if (subject.includes("과학") || isEnergy || isAstronomy || isGeology) {
    activityType = "창의적인 탐구 관찰과 조작적 실험 활동";
  } else if (subject.includes("사회") || isHistory || isCommunity || isEconomy) {
    activityType = "실제적인 사회 조사 및 인문학적 문화 체험";
  } else if (subject.includes("체육") || isSafety) {
    activityType = "신체적 조작과 안전 대처 훈련 활동";
  }

  return `본 체험처는 ${grade}학년 [${unit}] 단원의 학습 동기와 목표를 더욱 풍성하게 해줄 수 있도록, ${placeName}의 풍부한 시설과 인프라를 바탕으로 한 '${activityType}'을 수행하며 배움의 깊이를 더할 수 있는 맞춤형 학습장입니다.`;
}

/**
 * 체험학습에 적합하지 않은 장소 필터
 * 화장실, 주차장, 매점 등 시설명이 포함된 경우 제외
 */
function isValidExperiencePlace(placeName: string, categoryGroupCode?: string): boolean {
  const blacklist = [
    "화장실", "주차장", "주차", "매점", "편의점", "대피소", "관리실",
    "정류장", "버스정류장", "지하철역", "매표소", "출입구", "화물",
    "공동화장실", "개방화장실", "간이화장실",
    "아파트", "빌딩", "상가", "오피스텔", "원룸",
    "식당", "맛집", "카페", "커피", "핸드드립", "베이커리", "제과",
    "마트", "의원", "세탁", "미용", "병원", "약국",
    "숙박", "호텔", "모텔", "게스트하우스", "펜션",
    // 노인/아동/복지 시설 및 일반 사무실, 회사
    "요양원", "요양", "노인", "주간보호", "경로당", "어린이집", "유치원",
    "영농조합", "조합법인", "법인", "주식회사", "(주)", "사무소", "공장", "산업", "기업", "부동산", "공인중개사",
    // 교통·에너지 인프라
    "충전소", "주유소", "세차장", "주유",
    // 종교시설 (단독 체험처 부적합)
    "사찰", "절", "교회", "성당", "사원", "신사", "암자",
    // 오락·유흥
    "노래방", "pc방", "오락실", "게임", "술집", "주점",
    // 기타
    "마을회관", "학원", "교습소", "드라이브"
  ];

  const lowerName = placeName.toLowerCase();
  for (const word of blacklist) {
    if (lowerName.includes(word)) return false;
  }

  const allowedCodes = new Set(["AT4", "CT1", "PK6", "SC4", "ETC", ""]);
  if (categoryGroupCode && !allowedCodes.has(categoryGroupCode)) {
    const blockedCodes = ["FD6", "CE7", "AD5", "SW8", "BK9", "PO3", "HP8"];
    if (blockedCodes.includes(categoryGroupCode)) return false;
  }

  return true;
}

/**
 * 교과 주제/단원과 장소명의 적합도를 계산해 점수화
 */
function getRelevanceScore(placeName: string, subject: string, unit: string): number {
  const normUnit = unit.toLowerCase().trim();
  const normPlace = placeName.toLowerCase();

  let score = 0;

  // ── 0단계: 주제어 직접 포함 여부 (최우선 점수) ──────────
  if (normUnit.length >= 2 && !normUnit.includes("단원") && !normUnit.includes("학기")) {
    if (normPlace.includes(normUnit)) {
      score += 500;
    } else {
      const tokens = normUnit.split(" ").filter(t => t.length >= 2);
      for (const token of tokens) {
        if (normPlace.includes(token)) {
          score += 300;
        }
      }
    }
  }

  const isAiTech =
    normUnit.includes("ai") || normUnit.includes("인공지능") || normUnit.includes("코딩") ||
    normUnit.includes("로봇") || normUnit.includes("첨단") || normUnit.includes("과학") ||
    normUnit.includes("테크") || normUnit.includes("소프트웨어") || normUnit.includes("sw") ||
    normUnit.includes("it") || normUnit.includes("컴퓨터") || normUnit.includes("미래");

  if (isAiTech) {
    if (normPlace.includes("테크노") || normPlace.includes("테크")) score += 200;
    if (normPlace.includes("로봇") || normPlace.includes("ict") || normPlace.includes("it")) score += 200;
    if (normPlace.includes("과학체험") || normPlace.includes("창의융합")) score += 190;
    if (normPlace.includes("과학관"))       score += 180;
    if (normPlace.includes("어린이과학"))   score += 170;
    if (normPlace.includes("소프트웨어") || normPlace.includes("sw") || normPlace.includes("컴퓨터")) score += 180;
    // 패널티: 완전히 무관한 역사, 전통문화, 사찰, 조세박물관 등
    if (
      normPlace.includes("전통문화") || normPlace.includes("민속") ||
      normPlace.includes("조세") || normPlace.includes("사찰") ||
      normPlace.includes("유적") || (normPlace.includes("박물관") && !normPlace.includes("과학"))
    ) {
      score -= 220; // 0점 이하로 내려가게 하여 배제
    }
  }

  // 어떤 단원이든 충전소·주유소 등 완전 부적합 장소 즉시 -500
  if (
    normPlace.includes("충전소") || normPlace.includes("주유소") ||
    normPlace.includes("사찰") || normPlace.includes("교회") ||
    normPlace.includes("성당") || normPlace.includes("노래방")
  ) return -500;

  // ── 신체·건강 단원 ────────────────────────────────────────────────
  const isBodyHealth =
    normUnit.includes("몸") || normUnit.includes("신체") || normUnit.includes("건강") ||
    normUnit.includes("뇌") || normUnit.includes("심장") || normUnit.includes("근육") ||
    normUnit.includes("소화") || normUnit.includes("호흡") || normUnit.includes("뼈") ||
    normUnit.includes("혈액") || normUnit.includes("인체") || normUnit.includes("해부");

  if (isBodyHealth) {
    if (normPlace.includes("과학관"))       score += 160;
    if (normPlace.includes("어린이과학"))   score += 170;
    if (normPlace.includes("인체"))         score += 200;
    if (normPlace.includes("건강체험"))     score += 190;
    if (normPlace.includes("의학"))         score += 170;
    if (normPlace.includes("과학체험"))     score += 150;
    if (normPlace.includes("창의과학"))     score += 140;
    // 완전히 무관한 장소 패널티
    if (
      normPlace.includes("전통문화") || normPlace.includes("민속") ||
      normPlace.includes("역사박물관") || normPlace.includes("수목원") ||
      normPlace.includes("식물원") || normPlace.includes("불교")
    ) score -= 200;
  }

  const isPlantEcology =
    normUnit.includes("식물") || normUnit.includes("동식물") ||
    normUnit.includes("생태") || normUnit.includes("환경") ||
    normUnit.includes("동물") || normUnit.includes("곤충") ||
    normUnit.includes("꽃") || normUnit.includes("나무") || normUnit.includes("숲");

  if (isPlantEcology) {
    if (normPlace.includes("수목원"))      score += 200;
    if (normPlace.includes("식물원"))      score += 200;
    if (normPlace.includes("생태"))        score += 180;
    if (normPlace.includes("자연학습"))    score += 170;
    if (normPlace.includes("자연생태"))    score += 180;
    if (normPlace.includes("체험"))        score += 150;
    if (normPlace.includes("동물") && (normPlace.includes("체험") || normPlace.includes("과학"))) score += 160;
    if (normPlace.includes("곤충"))        score += 160;
    if (normPlace.includes("나비"))        score += 150;
    if (normPlace.includes("자연사"))      score += 140;
    if (normPlace.includes("동물원"))      score += 130;
    if (normPlace.includes("농촌") && normPlace.includes("체험")) score += 140;
    if (normPlace.includes("휴양림"))      score += 130;
    if (normPlace.includes("숲") && (normPlace.includes("체험") || normPlace.includes("교육"))) score += 140;
    if (normPlace.includes("정원"))        score += 150;
    if (normPlace.includes("생태공원"))    score += 160;
    if (normPlace.includes("역사") || normPlace.includes("기념관") || (normPlace.includes("박물관") && !normPlace.includes("자연사"))) score -= 100;
  }

  const isAstronomy =
    normUnit.includes("우주") || normUnit.includes("천체") || normUnit.includes("별") || normUnit.includes("지구");

  if (isAstronomy) {
    if (normPlace.includes("천문대"))      score += 200;
    if (normPlace.includes("천문"))        score += 180;
    if (normPlace.includes("플라네타리움")) score += 200;
    if (normPlace.includes("우주"))        score += 170;
    if (normPlace.includes("과학관"))      score += 120;
  }

  const isEnergy =
    normUnit.includes("빛") || normUnit.includes("에너지") || normUnit.includes("소리") || normUnit.includes("기계");

  if (isEnergy) {
    if (normPlace.includes("에너지") && normPlace.includes("체험")) score += 200;
    if (normPlace.includes("과학관"))      score += 160;
    if (normPlace.includes("어린이과학"))  score += 150;
    if (normPlace.includes("창의과학"))    score += 150;
  }

  const isHistory =
    normUnit.includes("역사") || normUnit.includes("문화재") || normUnit.includes("전통") ||
    normUnit.includes("유적") || normUnit.includes("민주") || normUnit.includes("유물");

  if (isHistory) {
    if (normPlace.includes("역사박물관"))  score += 200;
    if (normPlace.includes("박물관"))      score += 170;
    if (normPlace.includes("미술관"))      score += 180;
    if (normPlace.includes("기념관"))      score += 150;
    if (normPlace.includes("기념공원"))    score += 150;
    if (normPlace.includes("전시관"))      score += 160;
    if (normPlace.includes("문화재"))      score += 160;
    if (normPlace.includes("민속"))        score += 140;
    if (normPlace.includes("유적지"))      score += 160;
    if (normPlace.includes("수목원") || normPlace.includes("식물원")) score -= 80;
  }

  const isCommunity =
    normUnit.includes("지역") || normUnit.includes("지방") || normUnit.includes("공공");

  if (isCommunity) {
    if (normPlace.includes("문화관"))      score += 160;
    if (normPlace.includes("역사박물관"))  score += 170;
    if (normPlace.includes("민속촌"))      score += 150;
    if (normPlace.includes("전시관"))      score += 130;
    if (normPlace.includes("주민") && normPlace.includes("자치")) score += 120;
  }

  const isEconomy =
    normUnit.includes("경제") || normUnit.includes("시장") || normUnit.includes("소비") || normUnit.includes("생산");

  if (isEconomy) {
    if (normPlace.includes("전통시장"))    score += 180;
    if (normPlace.includes("화폐"))        score += 160;
    if (normPlace.includes("체험마을"))    score += 170;
    if (normPlace.includes("경제") && normPlace.includes("체험")) score += 160;
  }

  if (normPlace.includes("체험관") || normPlace.includes("체험장") || normPlace.includes("체험센터")) {
    score += 30;
  }

  return score;
}

// 하버사인(Haversine) 공식 함수
function getHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function POST(req: NextRequest) {
  try {
    let { eventId, grade, subject, unit, clientSchoolLat, clientSchoolLng, clientSchoolName, clientSchoolAddress, radius } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const limitRadius = Number(radius || "30");
    const searchRadius = limitRadius <= 20 ? limitRadius * 1000 : undefined;

    let schoolLat = clientSchoolLat ?? 36.4800;
    let schoolLng = clientSchoolLng ?? 127.2890;
    let schoolName = clientSchoolName ?? "세종초등학교";
    let schoolAddress = clientSchoolAddress ?? "세종특별자치시 한누리대로";

    if (clientSchoolAddress) {
      try {
        const coords = await geocode(clientSchoolAddress);
        if (coords) {
          schoolLat = coords.lat;
          schoolLng = coords.lng;
          console.log(`Successfully geocoded client school address [${clientSchoolAddress}] to:`, coords);
        }
      } catch (err) {
        console.error("Failed to geocode client school address:", err);
      }
    }

    // 1. Fetch Event Info + School coordinates from Supabase
    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();
        const { data: event } = await supabase
          .from("events")
          .select("grade, subject, unit, school_id, schools(name, address, lat, lng)")
          .eq("id", eventId)
          .single();

        if (event) {
          if (event.grade) grade = event.grade;
          if (event.subject) subject = event.subject;
          if (event.unit) unit = event.unit;

          if (event.schools) {
            const school: any = event.schools;
            schoolName = school.name || schoolName;
            schoolAddress = school.address || schoolAddress;
            if (school.lat && school.lng) {
              schoolLat = parseFloat(school.lat);
              schoolLng = parseFloat(school.lng);
            } else {
              const coords = await geocode(schoolAddress);
              if (coords) {
                schoolLat = coords.lat;
                schoolLng = coords.lng;
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to query school coord from Supabase:", err);
      }
    }

    // 2. 공공데이터 API(청소년활동진흥원인증프로그램)로 체험처 검색
    let certifiedPlaces: any[] = [];
    const region = schoolAddress.split(" ")[0] || "세종";

    const searchKeywords = buildSearchKeywords(subject, unit);
    console.log(`[Recommend] KYWA 검색 키워드: ${searchKeywords.join(", ")} (지역: ${region})`);

    try {
      const programs = await searchCertifiedProgramsMultiKeyword({
        region,
        keywords: searchKeywords,
        minResults: 5,
      });

      if (programs.length > 0) {
        const candidatePrograms = programs.slice(0, 15);
        const locations = await Promise.all(
          candidatePrograms.map(async (prog) => {
            const searchQuery = prog.organName
              ? `${prog.stateName} ${prog.cityName} ${prog.organName}`.trim()
              : `${prog.stateName} ${prog.cityName} ${prog.progName}`.trim();

            const kakaoResults = await searchPlaces(searchQuery, schoolLat, schoolLng, searchRadius);
            if (kakaoResults && kakaoResults.length > 0) {
              const place = kakaoResults[0];
              return {
                id: prog.makeSeq,
                name: prog.organName || prog.progName,
                programName: prog.progName,
                address: place.road_address_name || place.address_name,
                lat: parseFloat(place.y),
                lng: parseFloat(place.x),
                source: "kywa",
                safetyLevel: prog.safetyLevel,
                targetGrade: prog.targetGrade,
                phone: place.phone || "",
                place_url: place.place_url || "",
              };
            }

            const geoAddress = `${prog.stateName} ${prog.cityName}`;
            const coords = await geocode(geoAddress);
            return {
              id: prog.makeSeq,
              name: prog.organName || prog.progName,
              programName: prog.progName,
              address: geoAddress,
              lat: coords?.lat || schoolLat + (Math.random() - 0.5) * 0.05,
              lng: coords?.lng || schoolLng + (Math.random() - 0.5) * 0.05,
              source: "kywa",
              safetyLevel: prog.safetyLevel,
              targetGrade: prog.targetGrade,
              phone: "",
              place_url: "",
            };
          })
        );
        certifiedPlaces = locations;
        console.log(`[Recommend] 공공데이터 인증프로그램 체험처 ${certifiedPlaces.length}개 획득`);
      }
    } catch (err) {
      console.error("[KYWA] 공공데이터 검색 오류:", err);
    }

    // 3. 공공데이터 API 결과가 부족한 경우 카카오 키워드 검색으로 보완
    const targetCandidateCount = Math.max(20, limitRadius <= 20 ? 15 : limitRadius <= 50 ? 25 : 40);

    if (certifiedPlaces.length < 3) {
      console.log(`[Recommend] 공공데이터 결과 부족으로 카카오 키워드 검색 보완 (목표 후보수: ${targetCandidateCount}개)`);

      const kakaoKeywords = buildKakaoFallbackKeywords(subject, unit, region);
      const kakaoSearchRadius = limitRadius <= 20 ? limitRadius * 1000 : 20000;
      const resultsPerKeyword = limitRadius <= 20 ? 5 : limitRadius <= 50 ? 8 : 15;
      
      const rawCandidates: any[] = [];
      const seenPlaceIds = new Set<string>();

      // 1단계: 주요 검색어로 검색
      await Promise.all(
        kakaoKeywords.map(async (keyword) => {
          try {
            const results = await searchPlaces(keyword, schoolLat, schoolLng, kakaoSearchRadius);
            if (!results || results.length === 0) return;

            const valid = results.filter(r => isValidExperiencePlace(r.place_name, r.category_group_code));
            const scored = valid.map(r => ({
              ...r,
              _score: getRelevanceScore(r.place_name, subject, unit),
            })).sort((a, b) => b._score - a._score);

            const topN = scored.slice(0, resultsPerKeyword);
            for (const place of topN) {
              if (!seenPlaceIds.has(place.id)) {
                seenPlaceIds.add(place.id);
                rawCandidates.push(place);
              }
            }
          } catch (err) {
            console.error(`[Kakao] "${keyword}" 검색 실패:`, err);
          }
        })
      );

      // 2단계: 반경이 30km 초과 시 인접 지역 키워드 추가 검색
      if (limitRadius > 30) {
        const neighborRegions = getNeighborRegions(region);
        console.log(`[Recommend] 반경이 ${limitRadius}km로 30km 초과하여 인접지 검색: ${neighborRegions.join(", ")}`);

        await Promise.all(
          neighborRegions.flatMap(neighborRegion =>
            kakaoKeywords.slice(0, 3).map(async (keyword) => {
              const regionKeyword = keyword.startsWith(region)
                ? keyword.replace(region, neighborRegion)
                : `${neighborRegion} ${keyword.split(" ").slice(1).join(" ")}`;
              try {
                const results = await searchPlaces(regionKeyword, schoolLat, schoolLng, undefined);
                if (!results) return;

                const valid = results.filter(r => isValidExperiencePlace(r.place_name, r.category_group_code));
                // 인접지역 결과도 관련도 점수 계산 후 상위 추가
                const scoredNeighbor = valid.map(r => ({
                  ...r,
                  _score: getRelevanceScore(r.place_name, subject, unit),
                })).sort((a, b) => b._score - a._score);
                const topN = scoredNeighbor.slice(0, 5);
                for (const place of topN) {
                  if (!seenPlaceIds.has(place.id)) {
                    seenPlaceIds.add(place.id);
                    rawCandidates.push(place);
                  }
                }
              } catch (err) {
                // 인접지역 오류는 무시
              }
            })
          )
        );
      }

      console.log(`[Recommend] 카카오 수집 후보 총: ${rawCandidates.length}개`);

      const existingNames = new Set(certifiedPlaces.map(p => p.name));
      let addedCount = 0;

      for (const place of rawCandidates) {
        if (existingNames.has(place.place_name)) continue;

        const placeLat = parseFloat(place.y);
        const placeLng = parseFloat(place.x);

        certifiedPlaces.push({
          id: `kk-${addedCount}`,
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          lat: placeLat,
          lng: placeLng,
          source: "kakao",
          phone: place.phone || "",
          place_url: place.place_url || "",
        });
        existingNames.add(place.place_name);
        addedCount++;
      }
      console.log(`[Recommend] 카카오 보완 장소 추가: ${addedCount}개, 총 후보: ${certifiedPlaces.length}개 (이후 거리 및 적합도 필터링 진행)`);
    }

    // 4. 모든 후보지에 대하여 거리 및 관련도 점수 계산
    let scoredPlaces = certifiedPlaces.map((place) => {
      const distanceKm = getHaversineDistance(schoolLat, schoolLng, place.lat, place.lng);
      const relevanceScore = getRelevanceScore(place.name, subject, unit);
      return {
        ...place,
        distanceKm,
        relevanceScore
      };
    });

    let filteredPlaces = scoredPlaces.filter(p => p.distanceKm <= limitRadius);

    // 반경 내 매칭된 후보지가 없는 경우, 가장 가까운 곳 3개 강제 매칭
    if (filteredPlaces.length === 0 && scoredPlaces.length > 0) {
      // 주제와 완전히 무관한(관련도 0 이하) 장소가 강제 추천되는 것을 방지
      const relevantScored = scoredPlaces.filter(p => p.relevanceScore > 0);
      if (relevantScored.length > 0) {
        filteredPlaces = [...relevantScored].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
      } else {
        filteredPlaces = [...scoredPlaces].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
      }
    }

    // 관련성 점수 -500 이하(완전 부적합) 장소 제거
    const validPlaces = filteredPlaces.filter(p => p.relevanceScore > -500);
    if (validPlaces.length > 0) filteredPlaces = validPlaces;

    // 관련성이 양수인 장소가 3개 이상이면 음수·0점 장소 제외
    const positiveRelevancePlaces = filteredPlaces.filter(p => p.relevanceScore > 0);
    if (positiveRelevancePlaces.length >= 3) filteredPlaces = positiveRelevancePlaces;

    // ── 복합 점수(combinedScore) 기반 최종 정렬 ──────────────────────
    // 반경이 넓을수록 주제 적합성이 확실히 우선되도록 설계:
    //   combinedScore = relevanceScore(주제적합성) - 거리페널티
    //   거리페널티 = (distanceKm / limitRadius) * distancePenaltyWeight
    // 반경이 클수록 distancePenaltyWeight를 줄여 주제 적합성을 더 중시
    const distancePenaltyWeight = limitRadius <= 10 ? 60 : limitRadius <= 30 ? 40 : limitRadius <= 60 ? 20 : 10;

    filteredPlaces = filteredPlaces.map(p => ({
      ...p,
      combinedScore: p.relevanceScore - (p.distanceKm / limitRadius) * distancePenaltyWeight,
    }));

    filteredPlaces.sort((a: any, b: any) => b.combinedScore - a.combinedScore);

    // 최종적으로 상위 10개 선정
    certifiedPlaces = filteredPlaces.slice(0, 10);

    if (certifiedPlaces.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "체험처를 찾지 못했습니다. 카카오 API 연동(REST API 키) 또는 검색 반경 설정을 확인해주세요." 
      });
    }

    // 5. prompts/recommend.md 시스템 프롬프트 로드
    const promptPath = path.join(process.cwd(), "prompts", "recommend.md");
    let systemPrompt = "";
    try {
      systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } catch (err) {
      console.error("Failed to read recommend.md prompt:", err);
      systemPrompt = "초등학교/중학교 교과에 연계된 현장체험학습 추천 보고서를 작성해주세요. 응답은 지시된 JSON 형식으로 하십시오.";
    }

    const formattedPrompt = systemPrompt
      .replace("{grade}", grade.toString())
      .replace("{subject}", subject)
      .replace("{unit}", unit)
      .replace("{schoolLat}", schoolLat.toString())
      .replace("{schoolLng}", schoolLng.toString())
      .replace("{certifiedPlaces}", JSON.stringify(certifiedPlaces, null, 2));

    const userPrompt = `체험학습 추천 분석 요청: ${grade}학년, 과목: ${subject}, 단원: ${unit}. 후보 체험처 리스트를 기반으로 교과 연계 사유와 추천 분석 결과를 제시해주세요.`;

    // 6. Gemini API 호출
    let aiResponse: any;
    const isGeminiMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_gemini");

    if (!isGeminiMock) {
      try {
        aiResponse = await generateJSONRecommendation(formattedPrompt, userPrompt);
      } catch (err) {
        console.error("Gemini invocation failed, falling back to mock response:", err);
      }
    }

    if (!aiResponse) {
      aiResponse = {
        learningObjectives: `현장체험학습을 통해 ${grade}학년 학생들이 [${subject} - ${unit}] 단원의 주요 핵심 목표를 몸소 체득하고, 단체 활동을 통한 협동정신과 교과 지식에 대한 깊은 이해를 얻는 것을 목표로 합니다.`,
        recommendations: certifiedPlaces.map((place: any, idx) => ({
          placeId: place.id,
          name: place.name,
          matchScore: place.relevanceScore > 0 ? 5 : Math.max(1, 4 - idx),
          matchReason: getCustomMatchReason(place.name, grade.toString(), subject, unit),
          distanceKm: place.distanceKm
        }))
      };
    }

    // 7. 각 체험처의 교통사고율(TAAS API) 조회하여 안전성 점수 산정
    const recommendationsWithSafety = await Promise.all(
      aiResponse.recommendations.map(async (rec: any, idx: number) => {
        const placeDetail = certifiedPlaces.find(p => p.id === rec.placeId) || certifiedPlaces[idx];
        const lat = placeDetail?.lat || schoolLat;
        const lng = placeDetail?.lng || schoolLng;

         let safetyScore = 5.0;
         let sigunguAccidents = 0;
         let pedestrianAccidents = 0;
         let accidentList: any[] = [];
 
         try {
           // 카카오 좌표행정구역 API로 법정동 코드 조회
           const region = await getRegionCode(lat, lng);
           if (region) {
             // 반경 내 어린이 보행사고 다발지역 조회
             const accidentData = await getAccidentsByArea(lat, lng, 1.0);
             pedestrianAccidents = accidentData.totalCount;
             accidentList = accidentData.accidents || [];
             
             // 해당 지역(구군)의 스쿨존 사고 통계 조회
             const schoolZoneData = await getSchoolZoneAccidents(region.guGun);
             sigunguAccidents = schoolZoneData.totalCount;
             
             // 안전 점수 계산 (보행자 사고 및 스쿨존 사고 감점 반영)
             safetyScore = Math.max(0, 5.0 - (pedestrianAccidents * 0.4) - (sigunguAccidents * 0.2));
           } else {
             const accidentData = await getAccidentsByArea(lat, lng, 1.0);
             pedestrianAccidents = accidentData.totalCount;
             accidentList = accidentData.accidents || [];
             safetyScore = Math.max(0, 5.0 - (pedestrianAccidents * 0.5));
           }
         } catch (err) {
           console.error(`Failed to calculate safety score for ${rec.name}:`, err);
         }
 
         return {
           ...rec,
           rank: idx + 1,
           lat: lat,
           lng: lng,
           address: placeDetail.address,
           safetyScore: parseFloat(safetyScore.toFixed(1)),
           pedestrianAccidents,
           sigunguAccidents,
           phone: placeDetail?.phone || "",
           place_url: placeDetail?.place_url || "",
           accidentList,
         };
      })
    );

    // 7-2. Gemini 2.5 flash로 각 체험처 장소 설명 생성 (병렬 처리)
    const descriptionsMap = new Map<string, string>();
    try {
      await Promise.all(
        recommendationsWithSafety.map(async (rec: any) => {
          const placeDetail = certifiedPlaces.find(p => p.id === rec.placeId) ||
            certifiedPlaces[rec.rank - 1];
          const desc = await generatePlaceDescription(
            rec.name,
            placeDetail?.address || "",
            unit
          );
          if (desc) descriptionsMap.set(rec.placeId, desc);
        })
      );
      console.log(`[Recommend] Gemini 장소 설명 생성 완료: ${descriptionsMap.size}개`);
    } catch (err) {
      console.error("[Gemini] 장소 설명 생성 오류:", err);
    }

    // 장소 설명을 각 추천 항목에 합산
    const recommendationsWithDesc = recommendationsWithSafety.map((rec: any) => ({
      ...rec,
      placeDescription: descriptionsMap.get(rec.placeId) || rec.matchReason,
    }));

    // 8. 데이터베이스(Supabase)에 장소 및 추천 이력 저장
    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();

        for (const place of certifiedPlaces) {
          await supabase.from("places").upsert({
            id: (typeof place.id === "string" && place.id.includes("p-")) ? undefined : place.id,
            source: "kywa",
            external_id: place.id,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            safety_score: 4.5,
          }, { onConflict: "source,external_id" });
        }

        await supabase
          .from("events")
          .update({ status: "searching" })
          .eq("id", eventId);

        const { data: dbPlaces } = await supabase.from("places").select("id, external_id");

        const recInserts = recommendationsWithSafety.map((rec) => {
          const dbPlace = dbPlaces?.find(p => String(p.external_id) === String(rec.placeId));
          return {
            event_id: eventId,
            place_id: dbPlace?.id || rec.placeId,
            match_score: rec.matchScore,
            match_reason: rec.matchReason,
            distance_km: rec.distanceKm,
            rank: rec.rank,
          };
        });

        await supabase.from("recommendations").insert(recInserts);
      } catch (err) {
        console.error("Failed to save recommendations to Supabase:", err);
      }
    }

    // 9. 최종 응답 반환
    return NextResponse.json({
      success: true,
      learningObjectives: aiResponse.learningObjectives,
      schoolCoord: { lat: schoolLat, lng: schoolLng, name: schoolName },
      recommendations: recommendationsWithDesc,
    });
  } catch (error: any) {
    console.error("API /recommend route error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze recommendations" }, { status: 500 });
  }
}
