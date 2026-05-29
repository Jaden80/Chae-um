"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Shield, MapPin, Calendar, Globe, AlertTriangle,
  FileText, CheckCircle, Phone, Clock, Compass,
  Sun, Cloud, CloudRain, CloudSnow, Wind, Thermometer, Droplets,
  ClipboardCheck, Maximize, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WeatherSection from "@/components/feature/WeatherSection";
import { useTripStore } from "@/store/tripStore";

interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  hours: string;
  reservationRequired: boolean;
  activities: string;
  safetyScore: number;
  pedestrianAccidents: number;
  schoolZoneAccidents: number;
  lat: number;
  lng: number;
  accidentList?: any[];
}

const PLACE_ADDITIONAL_INFO: Record<string, {
  phone: string;
  website: string;
  hours: string;
  reservationRequired: boolean;
  activities: string;
}> = {
  "대전교통문화연수원": {
    phone: "042-250-1413",
    website: "https://www.djti.or.kr",
    hours: "09:00 - 18:00 (월요일 휴무)",
    reservationRequired: true,
    activities: "• 어린이 보행 안전 실습 및 교통사고 가상 시뮬레이션 체험\n• 지진, 대중교통 및 소방 화재 발생 시 대피 비상 안전 대책 실습\n• 안전 골든벨 퀴즈 및 교통 신호 체계 시뮬레이션을 통한 생활화"
  },
  "세종시립도서관": {
    phone: "044-301-4300",
    website: "https://lib.sejong.go.kr",
    hours: "09:00 - 22:00 (월요일/공휴일 휴관)",
    reservationRequired: false,
    activities: "• 도서관 문화 공간 투어 및 공공기관의 사회적 공헌 역할 인터뷰\n• 우리 고장 작가 코너 탐방 및 지역 도서 정보 큐레이팅 실습\n• 디지털 어린이 자료관 활용 지리/역사 연계 조별 모둠 탐구 활동"
  },
  "국립세종수목원": {
    phone: "044-270-5000",
    website: "https://www.sjb.or.kr",
    hours: "09:00 - 18:00 (월요일 휴무)",
    reservationRequired: true,
    activities: "• 학년 단원에 맞춘 온실 및 식물의 한살이 야외 관찰 퀴즈 투어\n• 전문 수목원 숲 해설가 동반 희귀 열대식물 생태 구조 학습\n• 반려식물 심기 및 나만의 숲 그리기 창의 미술 활동 연계"
  },
  "세종과학예술영재학교": {
    phone: "044-902-1100",
    website: "https://sasa.sjeduhs.kr",
    hours: "09:00 - 17:00 (주말 휴무)",
    reservationRequired: true,
    activities: "• 과학·예술 영재 캠퍼스 투어 및 융합 연구 시설 견학\n• 3학년 사회과 우리 고장 첨단 인프라 비교 조사 활동\n• 첨단 천체 관측실 관람 및 초등 융합 창의 교육 연계 워크숍"
  },
  "대통령기록관": {
    phone: "044-211-2000",
    website: "https://www.pa.go.kr",
    hours: "09:00 - 18:00 (월요일 휴무)",
    reservationRequired: false,
    activities: "• 역대 대통령 유물 및 헌법 기록물 중심 역사 관람 학습\n• 행정중심복합도시 세종의 역사적 탄생 유래 및 기록 전시 관람\n• 나만의 대통령 상징 도장 찍기 및 헌법 조문 쓰기 독후 체험"
  },
  "국립중앙과학관": {
    phone: "042-601-7979",
    website: "https://www.science.go.kr",
    hours: "09:00 - 17:30 (월요일 휴무)",
    reservationRequired: true,
    activities: "• 기초 과학 및 창의력 융합 놀이터 체험 학습\n• 로봇, 우주선 모형 등 미래형 최첨단 인프라 탐구\n• 학급별 모둠 창의 탐구 실험 참가"
  },
  "성주과일어린이과학체험관": {
    phone: "054-930-6893",
    website: "https://www.sj.go.kr/tour/contents.do?key=2318",
    hours: "09:00 - 17:30 (월요일 휴무)",
    reservationRequired: true,
    activities: "• 성주 참외 재배의 과학적 원리 및 스마트팜 기술 탐구 체험\n• 식물의 한살이 및 광합성 과학 실험 연계 야외 관찰 활동\n• 참외 품종 비교 전시관 관람 및 농업 과학 탐구 워크북 활동"
  },
  "자본시장역사박물관": {
    phone: "051-662-2559",
    website: "https://www.krxverse.co.kr",
    hours: "09:30 - 17:30 (주말/공휴일 휴관)",
    reservationRequired: false,
    activities: "• 우리나라 자본시장의 역사적 발전 및 경제 흐름 전시 관람\n• 주식 및 거래소의 기원과 역할 이해를 돕는 시뮬레이션 학습\n• 금융 골든벨 퀴즈 및 어린이 경제 기초 개념 탐구"
  },
  "화원역사문화체험관": {
    phone: "053-668-2000",
    website: "https://www.dalseong.daegu.kr",
    hours: "09:00 - 18:00 (월요일 휴무)",
    reservationRequired: false,
    activities: "• 화원 지역의 가야 역사와 고분 유적 문화재 탐구 미션\n• 사문진 나루터의 역사적 유래 및 옛 고장의 낙동강 뱃길 교역 답사\n• 전통문화 놀이 및 역사 퀴즈 모둠별 워크북 활동"
  },
  "국립어린이과학관": {
    phone: "02-3668-3350",
    website: "https://www.csc.go.kr",
    hours: "09:30 - 17:30 (월요일 휴관)",
    reservationRequired: true,
    activities: "• 어린이 감각 및 기초과학 체험 전시물 단체 관람\n• 4D 영상관 및 과학 극장 연계 융합 교육 활동\n• 학급 모둠별 상상창작실 메이커 체험 활동"
  },
  "금강수목원": {
    phone: "041-635-7400",
    website: "https://www.keumkang.go.kr",
    hours: "09:00 - 18:00 (신정/설/추석 및 지정일 휴무)",
    reservationRequired: false,
    activities: "• 중부권 최대 자연 학습림 내 희귀 유용 식물 생태 탐색\n• 산림자원연구소 전시관 및 야생동물 관찰원 투어 학습\n• 나뭇잎 탁본 및 숲길 걷기를 활용한 자연 친화 모둠 활동"
  }
};

function getAdditionalInfo(name: string) {
  for (const [key, info] of Object.entries(PLACE_ADDITIONAL_INFO)) {
    if (name.includes(key)) {
      return info;
    }
  }

  if (name.includes("안전체험") || name.includes("안전체험관")) {
    return {
      phone: "044-300-8224",
      website: "https://www.sejong.go.kr/safe",
      hours: "09:00 - 18:00 (공휴일 휴관)",
      reservationRequired: true,
      activities: "• 생활 재난 및 지진/화재 가상현실(VR) 대처 훈련\n• 소방 기구 조작 실습 및 안전 대피 통제 훈련\n• 심폐소생술(CPR) 및 완강기 비상 탈출 실습"
    };
  }

  if (name.includes("도서관")) {
    return {
      phone: "044-120-0000",
      website: "https://lib.egov.go.kr",
      hours: "09:00 - 18:00 (공휴일 휴관)",
      reservationRequired: false,
      activities: "• 공공도서관 정보 검색 및 독서 탐구 활동\n• 고장의 책 읽는 문화 조성 공간 답사\n• 도서 큐레이터 직업 체험 학습"
    };
  }

  if (name.includes("서울역사박물관") || name.includes("서울역사")) {
    return {
      phone: "02-724-0274",
      website: "https://museum.seoul.go.kr",
      hours: "09:00 - 18:00 (금요일 21:00 연장, 월요일 휴관)",
      reservationRequired: false,
      activities: "• 조선 시대부터 현대 서울에 이르는 역사관 소장 전시물 관람\n• 3학년 사회과 우리 고장 서울의 역사적 변천 과정 탐구 미션\n• 서울의 옛 모습 사진 비교 감상 및 모둠별 역사 토론 워크북 풀기"
    };
  }

  if (name.includes("충청북도 생태수목원") || name.includes("충청북도") || name.includes("미동산")) {
    return {
      phone: "043-220-6101",
      website: "https://www.chungbuk.go.kr/forest/index.do",
      hours: "09:00 - 18:00 (월요일 휴원, 입장마감 1시간 전)",
      reservationRequired: false,
      activities: "• 미동산수목원 내 울창한 메타세쿼이아 숲길 및 목재문화체험장 생태 관찰\n• 산림과학박물관 및 식물원 전시실 투어와 식물의 한살이 탐구 활동\n• 나무 공예 교실 및 유아/초등 숲해설 프로그램 연계 모둠 활동"
    };
  }

  if (name.includes("수목원") || name.includes("생태")) {
    return {
      phone: "044-270-0000",
      website: "https://www.forest.go.kr",
      hours: "09:00 - 18:00 (월요일 휴무)",
      reservationRequired: true,
      activities: "• 숲 생태 온실 야외 관찰 및 자연 보호 서약서 쓰기\n• 나무와 꽃들의 계절적 한살이 모습 현장 답사\n• 나뭇잎 탁본 찍기 등 친환경 만들기 교실 연계"
    };
  }

  if (name.includes("과학관") || name.includes("과학")) {
    return {
      phone: "044-900-0000",
      website: "https://www.science.go.kr",
      hours: "09:00 - 17:30 (월요일 휴무)",
      reservationRequired: true,
      activities: "• 기초 과학 및 창의력 융합 놀이터 체험 학습\n• 로봇, 우주선 모형 등 미래형 최첨단 인프라 탐구\n• 학급별 모둠 창의 탐구 실험 참가"
    };
  }

  return {
    phone: "044-110-0000",
    website: "https://www.sejong.go.kr",
    hours: "09:00 - 18:00 (공휴일 휴무)",
    reservationRequired: false,
    activities: "• 체험처 답사 및 현장 워크북 탐구 미션 수행\n• 학급별 안전 수칙 준수 하에 관찰 탐구 일지 작성\n• 체험 내용 연계 학급 발표회 및 토론 수행"
  };
}

function getDangerZoneDetails(placeName: string, schoolName: string) {
  const normPlace = placeName || "";
  const normSchool = schoolName || "출발 학교";

  // 화원역사문화체험관 전용 위협 분석
  if (
    normPlace.includes("화원역사") ||
    normPlace.includes("화원역사문화") ||
    normPlace.includes("화원체험관") ||
    normPlace.includes("역사문화체험관")
  ) {
    return [
      {
        title: "🚨 위험지점 1: 대구 달성군 상화로(지하화 공사) 우회 도로 급감속 구간",
        description: `${normSchool}에서 화원역사문화체험관으로 이동하는 경로 중 상화로 구간입니다. 현재 상화로 지하차도 공사로 인해 주행 차량이 측면 이면도로로 우회하고 있어, 임시 차선 변경과 공사 차량의 갑작스러운 진출입으로 대형 버스의 급감속 사고 위험이 매우 높습니다.`,
        countermeasure: "운전 기사에게 출발 전 사전 우회로 공지를 철저히 확인하도록 요청하고, 학생들의 안전벨트 착용 여부를 이동 개시 전 100% 점검한 후 출발하십시오. 이동 중에는 학생들이 자리에서 일어서지 않도록 재차 안내하십시오."
      },
      {
        title: "⚠️ 위험지점 2: 화원읍 사문진나루터 방면 진입로 좁은 보행 통로 및 차량 혼재",
        description: "화원역사문화체험관 인근 사문진나루터 방면 진입로는 인도와 차도가 물리적으로 분리되지 않은 협소 도로입니다. 관람객 차량 및 배달 이륜차가 보행로를 공유하여, 단체 학생 하차 시 이륜차 돌발 진입에 의한 접촉 사고 위험이 있습니다.",
        countermeasure: "하차 즉시 학생 전원을 건물 측 인도 안쪽에 1열로 빠르게 정렬시키고, 차량 통행이 완전히 멈춘 것을 확인한 후 이동하십시오. 인솔 교사 2명을 전·후방에 배치하여 이면도로 차량을 상시 감시하십시오."
      },
      {
        title: "ℹ️ 참고: 낙동강 하중도 진입 교량(화원유원지교) 편도 교행 구간",
        description: "화원유원지 방면으로 연결되는 낙동강 교량은 주말 및 현장 학습 시즌에 관광버스가 집중되어 교량 위 정체 발생 빈도가 높습니다. 정체 중 학생들이 차창 밖으로 신체를 내밀거나 안전벨트를 해제할 수 있습니다.",
        countermeasure: "교량 진입 전 교사가 '정차 중에도 안전벨트 유지' 방침을 재공지하고, 이동 중 2명 이상의 교사가 좌석 열 사이를 순회하며 확인하십시오."
      }
    ];
  }

  if (normPlace.includes("자본시장")) {
    return [
      {
        title: "🚨 위험지점 1: 부산 문현금융로 대형 차량 진출입 사각지대",
        description: `부산한솔학교에서 ${placeName}으로 진입하는 문현금융단지 교차로 구간입니다. 대형 오피스 빌딩 및 공사 차량 통행이 빈번하여 우회전 시 보행자 사각지대 위협이 큽니다.`,
        countermeasure: "학생 인솔 시 교차로 모퉁이에서 안전거리를 확보하고, 신호대기 중 차도 가까이 서지 않도록 지도바랍니다."
      },
      {
        title: "⚠️ 위험지점 2: 박물관 입구 이륜차 및 셔틀버스 혼잡 구역",
        description: "박물관 하차장 부근으로, 관람객 셔틀버스와 배달 이륜차의 보행로 침범 및 급정거 위험이 상존합니다.",
        countermeasure: "차량 하차 시 즉시 보행자 인도 안쪽 안전 구역으로 대피 정렬시키고, 모둠별 대열 이탈을 엄격히 통제해 주십시오."
      }
    ];
  }

  if (normPlace.includes("교통문화")) {
    return [
      {
        title: "🚨 위험지점 1: 대덕대로 교차로 고속 진입 차량 위협 구역",
        description: `${normSchool}에서 대전교통문화연수원으로 가기 위해 유성 대덕대로 엑스포 사거리를 지나는 지점입니다. 도로 폭이 넓어 과속 및 신호위반 진입 차량의 보행자 사고 위험이 높습니다.`,
        countermeasure: "횡단보도 신호가 켜져도 차량이 완전히 정지했는지 확인한 후에 횡단하도록 지도해 주십시오."
      },
      {
        title: "⚠️ 위험지점 2: 연수원 정문 앞 대형 버스 회전 정차대 혼잡",
        description: "여러 학교의 체험학습 대형 버스가 집중되는 구역으로, 차량 후진 및 회전 시 사각지대 사고 가능성이 큽니다.",
        countermeasure: "하차 및 대기 시 인솔 교사가 차량 후방을 상시 감시하고 학생들을 안전 펜스 안쪽에 도열시키십시오."
      }
    ];
  }

  if (normPlace.includes("서울역사박물관") || normPlace.includes("서울역사")) {
    return [
      {
        title: "🚨 위험지점 1: 새문안로 광화문 방향 버스 전용 차로 및 교통 혼잡 구역",
        description: `${normSchool}에서 ${placeName}으로 접근하는 새문안로 일대입니다. 서울 도심의 대동맥으로 일반 차량과 버스 혼재 및 급차선 변경 위험이 상존합니다.`,
        countermeasure: "학생 전원 버스 승하차 시 반드시 우측 인도 안쪽에서 안전하게 정렬시키고, 차도로 갑자기 내려서지 않도록 지도해 주십시오."
      },
      {
        title: "⚠️ 위험지점 2: 박물관 광장 주차장 회차 진입로 보행 사각지대",
        description: "박물관 진입 광장 인근은 보도 경계가 주정차 및 보행자로 매우 혼잡하며, 대형 버스가 진입하거나 회차할 때 전방 사각지대 충돌 우려가 큽니다.",
        countermeasure: "광장 진입로 횡단 시 인솔 교사는 신호 깃발을 들어 차량에 시인성을 제공하고, 인도의 유도 펜스 선을 따라 밀착 인솔해 주십시오."
      }
    ];
  }

  if (normPlace.includes("세종수목원") || (normPlace.includes("수목원") && normPlace.includes("세종"))) {
    return [
      {
        title: "🚨 위험지점 1: 세종수목원로 삼거리 공사 차량 교행지점",
        description: `${normSchool}에서 수목원 방향 수목원로 진입 교차로입니다. 주변 개발 사업으로 덤프트럭 등 대형 차량의 급회전 및 시야 방해가 유발됩니다.`,
        countermeasure: "도보 이동 구간 최소화 및 차량 이동 중 급정거에 대비하여 학생들의 버스 내 안전벨트 착용을 철저히 확인하십시오."
      },
      {
        title: "⚠️ 위험지점 2: 수목원 중앙 광장 인근 보행자 혼잡지대",
        description: "주말 및 단체 관람객이 동시에 몰려 보행선 혼선 및 학생 낙오/실종 위험이 있습니다.",
        countermeasure: "사전 무선 마이크 사용 금지 구역 등을 파악하고, 학생들에게 미아 방지 네임텍 혹은 모둠별 협동 대열을 상시 확인하십시오."
      }
    ];
  }

  if (normPlace.includes("충청북도 생태수목원") || normPlace.includes("충북 생태수목원") || normPlace.includes("미동산")) {
    return [
      {
        title: "🚨 위험지점 1: 보은-미원 간 산악 국도 급커브 및 결빙/안개 상습 구간",
        description: `${normSchool}에서 충청북도 생태수목원으로 이동하는 국도 도로 구간입니다. 급격한 경사와 S자형 급커브가 많아 대형 버스 운행 시 쏠림 및 차선 이탈 위험이 매우 높습니다.`,
        countermeasure: "버스 운전원에게 사전 저속 운행을 강력 권고하고, 학생들의 버스 내 완전 밀착 안전벨트 착용을 이동 개시 전 100% 점검하십시오."
      },
      {
        title: "⚠️ 위험지점 2: 수목원 입구 수목원길 교행 협소 및 보행선 혼선 구역",
        description: "수목원 매표소 및 주차장 진입로 부근입니다. 인도가 분리되지 않은 협소 보행로가 혼재되어 주차 차량 사이에서 학생이 뛰쳐나올 경우 시야 차단 사각지대가 심각합니다.",
        countermeasure: "하차 지점부터 수목원 정문 진입로까지 1열 종대로 밀착 인솔하며, 주차 차량 주변 보행 시 인솔 교사를 전/후방에 조밀하게 도열하여 이동하십시오."
      }
    ];
  }

  // General Fallback
  return [
    {
      title: `🚨 위험지점 1: ${normPlace} 진입 도로 어린이 보행 교통혼잡 구역`,
      description: `${normSchool}에서 체험처 방향으로 접근하는 보도 구간입니다. 주정차 차량으로 인해 주행 차량의 전방 시야가 차단되어 무단횡단 시 급정거 사고 확률이 높습니다.`,
      countermeasure: "인솔 교사를 보도 전방과 후방에 1명씩 배치하고 깃발을 지참하여 시인성을 극대화해 주십시오."
    },
    {
      title: "⚠️ 위험지점 2: 체험처 야외 주차장 진출입 차량 교행 사각지대",
      description: "관람차와 일반 방문객 차량이 혼합 진입하여 후진하거나 급회전하는 지점으로 어린이 낙상 및 차량 접촉 사고 위험이 있습니다.",
      countermeasure: "주차장 횡단 시 학생들을 일시 정지시키고 대형 버스 사이를 지나갈 때 특별한 주의를 기울이십시오."
    }
  ];
}

/**
 * 실제 TAAS 사고 데이터를 기반으로 위험지점별 맞춤 교사 대응 매뉴얼을 생성합니다.
 * 위치명 키워드와 사고 심각도를 분석하여 상황에 적합한 지도 대책을 반환합니다.
 */
function getAccidentCountermeasure(acc: any): string {
  const loc: string = (acc.occrrnc_lc || "").toLowerCase();
  const deaths = Number(acc.dth_dnv_cnt) || 0;
  const serious = Number(acc.se_dnv_cnt) || 0;
  const light = Number(acc.slt_dnv_cnt) || 0;

  // 심각도 기반 우선 경고 문구
  const severityPrefix =
    deaths > 0
      ? "⛔ 이 구간은 사망 사고가 발생한 극고위험 지점입니다. 반드시 아래 지도 대책을 철저히 이행하십시오. "
      : serious > 0
      ? "🔴 이 구간은 중상 사고가 발생한 고위험 지점입니다. "
      : "";

  // 위치 키워드별 맞춤 대응 매뉴얼
  if (
    loc.includes("교차로") ||
    loc.includes("사거리") ||
    loc.includes("삼거리") ||
    loc.includes("交叉路")
  ) {
    return (
      severityPrefix +
      "교차로 신호 대기 중 학생들이 차도 경계선을 넘지 않도록 인솔 교사를 전방에 1명 배치하십시오. " +
      "보행 신호가 켜진 후에도 좌·우회전 차량이 완전히 정지했는지 육안으로 확인한 뒤 횡단을 시작하십시오. " +
      "학생들은 2열 이상 짝을 맞춰 이동하며 횡단 중 뛰지 않도록 사전 안전 교육을 실시하십시오."
    );
  }

  if (loc.includes("이면도로") || loc.includes("골목") || loc.includes("좁은")) {
    return (
      severityPrefix +
      "이면도로는 인도와 차도가 분리되지 않은 경우가 많습니다. 학생 전원을 건물 측 가장자리에 1열로 정렬하고 " +
      "차량 통행 방향을 마주보며 이동하십시오. 인솔 교사는 차량 방향 쪽 학생 옆에 배치하여 시인성을 확보하고, " +
      "차량이 접근할 때마다 학생 전원을 즉시 정지·대피시키십시오."
    );
  }

  if (
    loc.includes("어린이보호구역") ||
    loc.includes("스쿨존") ||
    loc.includes("어린이 보호구역")
  ) {
    return (
      severityPrefix +
      "스쿨존 내에서는 불법 주정차 차량으로 인해 운전자의 시야가 차단될 수 있습니다. " +
      "학생 횡단 시 주정차 차량 앞뒤에서 인솔 교사가 먼저 차도로 나와 차량 흐름을 확인한 후 학생을 유도하십시오. " +
      "방호 깃발을 사용하여 접근 차량에 학생 이동 사실을 명확히 고지하십시오."
    );
  }

  if (
    loc.includes("놀이터") ||
    loc.includes("공원") ||
    loc.includes("어린이 놀이")
  ) {
    return (
      severityPrefix +
      "놀이터·공원 인근 도로는 아이들의 갑작스러운 도로 진입이 잦아 차량 급정거 사고가 빈번합니다. " +
      "학생들이 도로 쪽으로 뛰거나 이동하지 않도록 출발 전 명확한 안전 수칙을 공지하십시오. " +
      "인솔 교사는 놀이공간과 차도 경계 지점을 상시 감시하며, 학생이 경계를 벗어나면 즉시 제지하십시오."
    );
  }

  if (
    loc.includes("횡단보도") ||
    loc.includes("건널목") ||
    loc.includes("육교")
  ) {
    return (
      severityPrefix +
      "이 횡단보도는 실제 사고가 발생한 다발 지점입니다. 반드시 보행 신호 점등 후 차량이 완전히 멈춘 것을 확인하고 횡단하십시오. " +
      "학생들을 2열 종대로 정렬하고 인솔 교사 1명은 선두, 1명은 후미에 배치하십시오. " +
      "우회전 차량에 특히 주의하며, 통행 중 절대 달리지 않도록 사전 지도하십시오."
    );
  }

  if (
    loc.includes("주차장") ||
    loc.includes("주차") ||
    loc.includes("차량 진입")
  ) {
    return (
      severityPrefix +
      "주차장은 후진·급회전 차량의 사각지대가 많아 어린이 접촉 사고 위험이 높습니다. " +
      "버스 하차 직후 학생 전원을 안전 펜스 안쪽이나 건물 벽면 방향으로 즉시 대피 정렬시키십시오. " +
      "주차 차량 사이를 이동할 때는 반드시 인솔 교사가 선두에서 차량 진입 여부를 확인 후 유도하십시오."
    );
  }

  if (
    loc.includes("버스") ||
    loc.includes("정류장") ||
    loc.includes("버스정류소")
  ) {
    return (
      severityPrefix +
      "버스 정류장 인근은 대형 차량의 급정차와 출발이 잦아 학생 보행 위험이 매우 높습니다. " +
      "학생들이 차도로 내려서지 않도록 인도 안쪽에 대기하게 하고, 버스 승하차 시 인솔 교사가 차량 앞뒤를 확인하십시오. " +
      "이동 중 전후방 버스 접근에 대비하여 학생 대열을 건물 쪽으로 최대한 밀착 유도하십시오."
    );
  }

  if (
    loc.includes("도로") ||
    loc.includes("대로") ||
    loc.includes("로") ||
    loc.includes("길")
  ) {
    const isHighSeverity = deaths > 0 || serious >= 2;
    return (
      severityPrefix +
      (isHighSeverity
        ? "이 도로 구간은 중대 사고가 기록된 극위험 지점입니다. 가능한 경우 이 구간 도보 이동을 대체 경로로 우회하는 것을 강력히 권고합니다. "
        : "") +
      "인솔 교사를 대열 전방과 후방에 각 1명씩 배치하고 안전 깃발로 시인성을 확보하십시오. " +
      "차량이 많은 시간대(등·하교 시간, 출퇴근 피크)는 피해 이동하고, 이동 중 학생들이 2열 대열을 유지하도록 지도하십시오."
    );
  }

  // 기본 fallback 대응 매뉴얼
  return (
    severityPrefix +
    "도로교통공단이 지정한 실제 사고 다발 구역입니다. 해당 지점 통과 시 인솔 교사를 전·후방에 배치하고 방호 깃발을 소지하여 차량에 학생 이동 사실을 고지하십시오. " +
    "학생 전원이 인도 안쪽에서 대열을 유지하도록 하고, 차량이 완전히 멈춘 것을 확인한 후 횡단하십시오. " +
    "고위험 구역 도착 전 학생들에게 사전 안전 수칙 교육을 반드시 실시하십시오."
  );
}

export default function PlaceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const eventId = searchParams.get("eventId");

  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState<PlaceDetail | null>(null);

  // 체험학습 날씨 정보
  const [tripDate, setTripDate] = useState<string>("");
  const [weather, setWeather] = useState<{
    weatherLabel: string;
    tempMax: number | null;
    tempMin: number | null;
    precipitation: number;
    windspeed: number | null;
    pop: number | null;
    pm10: number | null;
    pm10Grade: string | null;
    pm25: number | null;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  // 네비게이션 경로 상태
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [navPath, setNavPath] = useState<{ lat: number; lng: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Load school coord from teacher profile saved in localStorage
  const [schoolCoord, setSchoolCoord] = useState({
    lat: 36.4800,
    lng: 127.2890,
    name: "세종초등학교",
  });

  useEffect(() => {
    if (mapRef.current && window.kakao && window.kakao.maps) {
      setTimeout(() => {
        mapRef.current.relayout();
        if (schoolCoord && place) {
          const bounds = new window.kakao.maps.LatLngBounds();
          bounds.extend(new window.kakao.maps.LatLng(schoolCoord.lat, schoolCoord.lng));
          bounds.extend(new window.kakao.maps.LatLng(place.lat, place.lng));
          if (place.accidentList && place.accidentList.length > 0) {
            place.accidentList.forEach((acc: any) => {
              bounds.extend(new window.kakao.maps.LatLng(acc.lat, acc.lng));
            });
          }
          if (navPath && navPath.length > 0) {
            navPath.forEach((p) => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
          }
          mapRef.current.setBounds(bounds, 60);
        }
      }, 50);
    }
  }, [isMapExpanded, schoolCoord, place, navPath]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("safety_pick_teacher_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        setSchoolCoord({
          lat: profile.schoolLat || 36.4800,
          lng: profile.schoolLng || 127.2890,
          name: profile.schoolName ?? "소속 학교",
        });
      }
      // 희망일 불러오기
      const savedDate = localStorage.getItem("safety_pick_trip_date");
      if (savedDate) setTripDate(savedDate);
    } catch {}
  }, []);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Try loading from localStorage cached recommendations
      try {
        const savedRecs = localStorage.getItem("safety_pick_last_recommendations");
        if (savedRecs) {
          const recs = JSON.parse(savedRecs);
          const matched = recs.find((r: any) => r.placeId === id || r.id === id);
          if (matched) {
            const info = getAdditionalInfo(matched.name);
            
            // 실제 카카오 API 등으로 수집한 정보가 있으면 우선 적용하고 없으면 fallback 정보(info) 사용
            const displayPhone = (matched.phone && matched.phone.trim() !== "") ? matched.phone : info.phone;
            
            // 만약 info.website가 플레이스홀더 성격의 기본 홈페이지이고, 카카오 지도의 place_url이 있으면 place_url을 사용
            const isPlaceholderWebsite = info.website.includes("egov.go.kr") || info.website.includes("sejong.go.kr") || info.website.includes("forest.go.kr") || (info.website === "https://www.science.go.kr" && !matched.name?.includes("국립중앙과학관"));
            const displayWebsite = (matched.place_url && matched.place_url.trim() !== "" && (isPlaceholderWebsite || info.website === ""))
              ? matched.place_url
              : info.website;

            setPlace({
              id: matched.placeId || matched.id || id,
              name: matched.name,
              address: matched.address,
              lat: matched.lat,
              lng: matched.lng,
              safetyScore: matched.safetyScore || 5.0,
              pedestrianAccidents: matched.pedestrianAccidents || 0,
              schoolZoneAccidents: matched.sigunguAccidents || 0,
              phone: displayPhone,
              website: displayWebsite,
              hours: info.hours,
              reservationRequired: info.reservationRequired,
              activities: info.activities,
              accidentList: matched.accidentList || [],
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load details from localStorage:", e);
      }

      // Hardcoded fallback list matching the 5 Sejong landmarks
      const mockPlaces: Record<string, PlaceDetail> = {
        "p-1": {
          id: "p-1",
          name: "대전교통문화연수원",
          address: "대전 유성구 대덕대로 480",
          phone: "042-250-1413",
          website: "https://www.djti.or.kr",
          hours: "09:00 - 18:00 (월요일 휴무)",
          reservationRequired: true,
          safetyScore: 5.0,
          pedestrianAccidents: 0,
          schoolZoneAccidents: 0,
          lat: 36.37813285,
          lng: 127.3870525,
          activities: "• 어린이 보행 안전 실습 및 교통사고 가상 시뮬레이션 체험\n• 지진, 대중교통 및 소방 화재 발생 시 대피 비상 안전 대책 실습\n• 안전 골든벨 퀴즈 및 교통 신호 체계 시뮬레이션을 통한 생활화"
        },
        "p-2": {
          id: "p-2",
          name: "세종시립도서관",
          address: "세종특별자치시 세종로 1207",
          phone: "044-301-4300",
          website: "https://lib.sejong.go.kr",
          hours: "09:00 - 22:00 (월요일/공휴일 휴관)",
          reservationRequired: false,
          safetyScore: 5.0,
          pedestrianAccidents: 0,
          schoolZoneAccidents: 0,
          lat: 36.5105312,
          lng: 127.2404468,
          activities: "• 도서관 문화 공간 투어 및 공공기관의 사회적 공헌 역할 인터뷰\n• 우리 고장 작가 코너 탐방 및 지역 도서 정보 큐레이팅 실습\n• 디지털 어린이 자료관 활용 지리/역사 연계 조별 모둠 탐구 활동"
        },
        "p-3": {
          id: "p-3",
          name: "국립세종수목원",
          address: "세종특별자치시 수목원로 136",
          phone: "044-270-5000",
          website: "https://www.sjb.or.kr",
          hours: "09:00 - 18:00 (월요일 휴무)",
          reservationRequired: true,
          safetyScore: 5.0,
          pedestrianAccidents: 0,
          schoolZoneAccidents: 0,
          lat: 36.4980585,
          lng: 127.285724,
          activities: "• 학년 단원에 맞춘 온실 및 식물의 한살이 야외 관찰 퀴즈 투어\n• 전문 수목원 숲 해설가 동반 희귀 열대식물 생태 구조 학습\n• 반려식물 심기 및 나만의 숲 그리기 창의 미술 활동 연계"
        },
        "p-4": {
          id: "p-4",
          name: "세종과학예술영재학교",
          address: "세종특별자치시 달빛1로 265",
          phone: "044-902-1100",
          website: "https://sasa.sjeduhs.kr",
          hours: "09:00 - 17:00 (주말 휴무)",
          reservationRequired: true,
          safetyScore: 5.0,
          pedestrianAccidents: 0,
          schoolZoneAccidents: 0,
          lat: 36.526233,
          lng: 127.258957,
          activities: "• 과학·예술 영재 캠퍼스 투어 및 융합 연구 시설 견학\n• 3학년 사회과 우리 고장 첨단 인프라 비교 조사 활동\n• 첨단 천체 관측실 관람 및 초등 융합 창의 교육 연계 워크숍"
        },
        "p-5": {
          id: "p-5",
          name: "대통령기록관",
          address: "세종특별자치시 다솜로 250",
          phone: "044-211-2000",
          website: "https://www.pa.go.kr",
          hours: "09:00 - 18:00 (월요일 휴무)",
          reservationRequired: false,
          safetyScore: 5.0,
          pedestrianAccidents: 0,
          schoolZoneAccidents: 0,
          lat: 36.505703,
          lng: 127.262507,
          activities: "• 역대 대통령 유물 및 헌법 기록물 중심 역사 관람 학습\n• 행정중심복합도시 세종의 역사적 탄생 유래 및 기록 전시 관람\n• 나만의 대통령 상징 도장 찍기 및 헌법 조문 쓰기 독후 체험"
        }
      };

      const selected = mockPlaces[id] || mockPlaces["p-3"];
      const mockAccidentList = [
        {
          occrrnc_dt: "2023-06-15 16:40",
          occrrnc_lc: `${selected.name} 앞 삼거리 교차로`,
          dth_dnv_cnt: 0,
          se_dnv_cnt: 1,
          slt_dnv_cnt: 2,
          inj_dnv_cnt: 0,
          lat: selected.lat + 0.0015,
          lng: selected.lng - 0.0012,
        }
      ];
      setPlace({
        ...selected,
        accidentList: selected.accidentList || mockAccidentList
      });
      setLoading(false);
    };

    fetchPlaceDetails();
  }, [id]);

  // 2-A. 네비게이션 경로(Directions API) 비동기 로드
  useEffect(() => {
    if (loading || !place) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch("/api/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originLat: schoolCoord.lat,
            originLng: schoolCoord.lng,
            destLat: place.lat,
            destLng: place.lng,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.path && data.path.length > 0) {
            setNavPath(data.path);
            setRouteInfo({ distance: data.distance, duration: data.duration });
          }
        }
      } catch (err) {
        console.error("[Directions] 경로 로드 실패:", err);
      }
    };

    fetchRoute();
  }, [loading, place, schoolCoord]);

  // 2-B. 카카오맵 초기화 — 마커만 표시, 경로는 navPath 로드 후 2-C에서 그림
  useEffect(() => {
    if (loading || !place) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";

    const drawMap = () => {
      if (!mapContainerRef.current) return;
      // 이미 맵이 생성된 경우 재생성 방지
      if (mapRef.current) return;

      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(
          (place.lat + schoolCoord.lat) / 2,
          (place.lng + schoolCoord.lng) / 2
        ),
        level: 7,
      });
      mapRef.current = map;

      const schoolLatLng = new window.kakao.maps.LatLng(schoolCoord.lat, schoolCoord.lng);
      const placeLatLng = new window.kakao.maps.LatLng(place.lat, place.lng);

      // 학교 마커
      new window.kakao.maps.Marker({ position: schoolLatLng, map });
      new window.kakao.maps.CustomOverlay({
        position: schoolLatLng,
        content: `<div style="background:#2563eb;color:#fff;font-weight:700;font-size:10px;padding:3px 8px;border-radius:999px;border:2px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);transform:translateY(-36px) translateX(-50%);position:absolute">🏫 출발 학교</div>`,
        yAnchor: 1,
      }).setMap(map);

      // 체험처 마커
      new window.kakao.maps.Marker({ position: placeLatLng, map });
      new window.kakao.maps.CustomOverlay({
        position: placeLatLng,
        content: `<div style="background:#ef4444;color:#fff;font-weight:700;font-size:10px;padding:3px 8px;border-radius:999px;border:2px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);transform:translateY(-36px) translateX(-50%);position:absolute">📍 ${place.name}</div>`,
        yAnchor: 1,
      }).setMap(map);

      // 사고 다발지 마커 및 반경 원 그리기
      if (place.accidentList && place.accidentList.length > 0) {
        place.accidentList.forEach((acc: any) => {
          const accLatLng = new window.kakao.maps.LatLng(acc.lat, acc.lng);
          const circle = new window.kakao.maps.Circle({
            center: accLatLng,
            radius: 100,
            strokeWeight: 2,
            strokeColor: "#ef4444",
            strokeOpacity: 0.8,
            strokeStyle: "solid",
            fillColor: "#ef4444",
            fillOpacity: 0.3,
          });
          circle.setMap(map);
          new window.kakao.maps.CustomOverlay({
            position: accLatLng,
            content: `<div style="background:#dc2626;color:#fff;font-weight:900;font-size:10px;width:20px;height:20px;border-radius:50%;text-align:center;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3);transform:translateX(-50%) translateY(-50%);position:absolute;display:flex;align-items:center;justify-content:center">!</div>`,
            yAnchor: 0.5,
            xAnchor: 0.5,
          }).setMap(map);
        });
      }

      // 뷰포트 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(schoolLatLng);
      bounds.extend(placeLatLng);
      if (place.accidentList && place.accidentList.length > 0) {
        place.accidentList.forEach((acc: any) => {
          bounds.extend(new window.kakao.maps.LatLng(acc.lat, acc.lng));
        });
      }
      map.setBounds(bounds, 60);
    };

    const initKakaoMap = () => {
      // kakao.maps.Map이 함수로 사용 가능한 상태인지 확인
      if (window.kakao && window.kakao.maps && typeof window.kakao.maps.Map === 'function') {
        drawMap();
        return;
      }
      // kakao는 있지만 maps가 아직 로드 중인 경우 → load() 콜백 등록
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(drawMap);
        return;
      }
      // SDK가 아직 로드되지 않은 경우 → 폴링으로 대기 (layout.tsx에서 Script로 로드 중)
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.Map === 'function') {
          clearInterval(poll);
          drawMap();
        } else if (window.kakao && window.kakao.maps) {
          clearInterval(poll);
          window.kakao.maps.load(drawMap);
        } else if (attempts > 50) {
          // 5초 이상 대기 후에도 로드 안 되면 중단
          clearInterval(poll);
          console.warn('[KakaoMap] SDK 로드 타임아웃');
        }
      }, 100);
    };

    // mapRef 초기화 (페이지 재방문 시 재생성)
    mapRef.current = null;
    const timer = setTimeout(initKakaoMap, 500);
    return () => clearTimeout(timer);
  }, [loading, place, schoolCoord]);

  // 2-C. 경로 로드 완료 후 지도 경로 재그리기
  useEffect(() => {
    if (!mapRef.current || navPath.length < 2) return;
    if (!window.kakao || !window.kakao.maps) return;

    const map = mapRef.current;

    const schoolLatLng = new window.kakao.maps.LatLng(schoolCoord.lat, schoolCoord.lng);
    const placeLatLng = new window.kakao.maps.LatLng(place!.lat, place!.lng);

    const pathLatLng = navPath.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));

    // 외곽선
    new window.kakao.maps.Polyline({
      path: pathLatLng,
      strokeWeight: 9,
      strokeColor: "#1e40af",
      strokeOpacity: 0.25,
      strokeStyle: "solid",
    }).setMap(map);

    // 메인 경로
    new window.kakao.maps.Polyline({
      path: pathLatLng,
      strokeWeight: 5,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.92,
      strokeStyle: "solid",
    }).setMap(map);

    // 위험 구간 오버레이 갱신
    const danger1Idx = Math.floor(navPath.length * 0.3);
    const danger2Idx = Math.floor(navPath.length * 0.7);
    const dangerSpots = [navPath[danger1Idx], navPath[danger2Idx]];
    const dangerLabels = ["🚨 위험 구간 1", "⚠️ 위험 구간 2"];
    const dangerColors = ["#dc2626", "#f59e0b"];

    dangerSpots.forEach((spot, i) => {
      if (!spot) return;
      const latLng = new window.kakao.maps.LatLng(spot.lat, spot.lng);
      new window.kakao.maps.CustomOverlay({
        position: latLng,
        content: `<div style="background:${dangerColors[i]};color:#fff;font-weight:700;font-size:10px;padding:3px 10px;border-radius:8px;border:2px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);transform:translateY(-36px) translateX(-50%);position:absolute">${dangerLabels[i]}</div>`,
        yAnchor: 1,
      }).setMap(map);
    });

    // 뷰포트 재조정
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(schoolLatLng);
    bounds.extend(placeLatLng);
    pathLatLng.forEach((p) => bounds.extend(p));
    map.setBounds(bounds, 60);
  }, [navPath]);

  if (loading || !place) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">체험처 안전 분석 보고서 로딩 중...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 -ml-4"
      >
        <ArrowLeft className="w-4 h-4" />
        추천 리스트로 돌아가기
      </Button>

      {/* Main Place Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">KYWA 국가 안전인증</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">교과 적합 1등급</Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800">{place.name}</h1>
            <p className="text-slate-500 font-semibold flex items-center gap-1">
              <MapPin className="w-4.5 h-4.5 text-slate-400" />
              {place.address}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsChecklistDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-6 rounded-xl flex items-center justify-center gap-2 shadow-sm w-full"
            >
              <ClipboardCheck className="w-5 h-5" />
              사전 안전점검 체크리스트 작성
            </Button>
            <Button
              onClick={() => {
                useTripStore.getState().setPlace({
                  placeId: place.id,
                  name: place.name,
                  address: place.address,
                  latitude: place.lat,
                  longitude: place.lng,
                  phone: place.phone,
                  category: '체험처',
                });
                router.push('/doc-wizard/step/type');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-6 rounded-xl flex items-center justify-center gap-2 shadow-sm w-full"
            >
              <FileText className="w-5 h-5" />
              이 장소로 계획서 생성하기
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <Phone className="w-5 h-5 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">문의처</span>
              <span>{place.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <Clock className="w-5 h-5 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">운영시간</span>
              <span>{place.hours}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">예약 요건</span>
              <span>{place.reservationRequired ? "단체 예약 필수" : "자유 관람"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Analysis & Path map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Map and Danger analysis */}
        <div className="md:col-span-2 space-y-6">
          {/* Danger Analysis Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                🚨 경로 및 교통 안전 위협 분석
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                학교부터 체험처까지의 차량 운행 경로 및 스쿨존 사고 유발 가능 다발지점을 모니터링합니다.
              </p>
            </div>

            {/* Route Map */}
            <div className={
              isMapExpanded 
                ? "fixed inset-0 z-[100] w-screen h-screen bg-slate-100" 
                : "w-full h-80 rounded-2xl border border-slate-200 overflow-hidden relative"
            }>
              <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
              
              {/* Expand/Close Button */}
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="absolute top-4 right-4 z-50 p-2.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md hover:bg-white text-slate-800 transition-all hover:scale-105"
                title={isMapExpanded ? "지도 원래 크기로" : "지도 크게 보기"}
              >
                {isMapExpanded ? <X className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>

              {/* 경로 정보 오버레이 */}
              {routeInfo && (
                <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                  <div className="bg-white/95 backdrop-blur border border-blue-100 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    {(routeInfo.distance / 1000).toFixed(1)} km
                  </div>
                  <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    약 {Math.ceil(routeInfo.duration / 60)}분
                  </div>
                </div>
              )}

            </div>

            {/* Danger Zone Explanations */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                ⚠️ 실시간 위험구간 상세 안내 및 교사 대응 매뉴얼
              </h3>
              <div className="space-y-4 text-xs">
                {place.accidentList && place.accidentList.length > 0 ? (
                  place.accidentList.map((acc: any, idx: number) => (
                    <div key={`taas-${idx}`} className="space-y-1.5 bg-white border border-red-100 p-4 rounded-xl shadow-sm">
                      <h4 className="font-bold text-red-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        🚨 위험지점 {idx + 1}: {acc.occrrnc_lc}
                      </h4>
                      <p className="text-slate-600 font-semibold leading-relaxed pl-5">
                        <strong className="text-slate-800">위험 요인 (실제 교통사고 다발지역):</strong> 도로교통공단 지정 보행어린이 사고다발 구역입니다. (사고통계 일시: {acc.occrrnc_dt || "최근 통계"} | 피해 규모: 사망 {acc.dth_dnv_cnt}명, 중상 {acc.se_dnv_cnt}명, 경상 {acc.slt_dnv_cnt}명, 부상신고 {acc.inj_dnv_cnt}명)
                      </p>
                      <p className="text-blue-600 font-bold leading-relaxed pl-5">
                        <strong className="text-blue-700">💡 지도 대책:</strong> {getAccidentCountermeasure(acc)}
                      </p>
                    </div>
                  ))
                ) : (
                  getDangerZoneDetails(place.name, schoolCoord.name).map((dz, idx) => (
                    <div key={`default-${idx}`} className="space-y-1.5 bg-white border border-slate-150 p-4 rounded-xl shadow-sm">
                      <h4 className="font-bold text-amber-700 flex items-center gap-1.5">
                        {dz.title}
                      </h4>
                      <p className="text-slate-600 font-semibold leading-relaxed pl-5">
                        <strong className="text-slate-800">위험 요인:</strong> {dz.description}
                      </p>
                      <p className="text-blue-600 font-bold leading-relaxed pl-5">
                        <strong className="text-blue-700">💡 지도 대책:</strong> {dz.countermeasure}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Safety Score Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-slate-400 block">스쿨존 어린이 사고</span>
                <span className="text-lg font-black text-emerald-600 block">{place.schoolZoneAccidents} 건</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-slate-400 block">보행자 교통사고 (1km 반경)</span>
                <span className="text-lg font-black text-amber-600 block">{place.pedestrianAccidents} 건</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl text-center space-y-1 shadow-sm">
                <span className="text-xs font-bold text-emerald-100 block">통합 안전 점수</span>
                <span className="text-xl font-black block flex items-center justify-center gap-1">
                  <Shield className="w-5 h-5 text-white fill-white/10" />
                  {place.safetyScore} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* ───── 날씨 및 기상 교사 대응 매뉴얼 섹션 ───── */}
          <WeatherSection
            tripDate={tripDate}
            placeLat={place.lat}
            placeLng={place.lng}
            placeName={place.name}
            placeAddress={place.address}
          />
        </div>

        {/* Right 1 Column: AI Classroom Activities */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-800">🏫 교과 연계 학습 활동</h2>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
                {place.activities}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800">체험처 온라인 주소</h2>
            <a 
              href={place.website} 
              target="_blank" 
              className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-slate-400" />
              공식 웹사이트 방문 &rarr;
            </a>
          </div>
        </div>
      </div>

      {isChecklistDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-800">
                자동 불러오기
              </h3>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                e청소년(한국청소년활동진흥원)의 국가 인증 데이터와 시설 정보를 자동으로 불러올까요?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push(`/previsit/${eventId}?placeId=${place.id}&placeName=${encodeURIComponent(place.name)}&address=${encodeURIComponent(place.address)}&placeLat=${place.lat}&placeLng=${place.lng}&schoolLat=${schoolCoord.lat}&schoolLng=${schoolCoord.lng}&auto=true`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-xl w-full"
              >
                네, 자동으로 불러오기
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/previsit/${eventId}?placeId=${place.id}&placeName=${encodeURIComponent(place.name)}&address=${encodeURIComponent(place.address)}`)}
                className="py-5 rounded-xl font-bold w-full"
              >
                아니요, 직접 입력할게요
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsChecklistDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
