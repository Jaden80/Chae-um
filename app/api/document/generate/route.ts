import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDocumentSpecificPrompt } from "@/lib/docPrompts";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, tripPlan, schoolSnapshot, staffInfo, placeInfo, weatherInfo, routeInfo, safetyPickContext, students } = body;

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const DOC_META: Record<string, { title: string; description: string }> = {
      p01_tripPlan:         { title: "현장체험학습 실시 계획서",    description: "전체 운영 계획, 목적·일정·예산 총괄" },
      p02_consentForm:      { title: "학부모 동의서 및 안내문",     description: "학부모 대상 안내 및 동의 서명 양식" },
      p03_safetyPlan:       { title: "안전사고 예방 및 대책 계획서", description: "인솔 교사 역할, 안전 수칙, 사고 대응 절차" },
      p04_emergencyContact: { title: "비상연락체계표",              description: "교사·학부모·인근 병원·응급실 연락처" },
      p05_scheduleTable:    { title: "세부 일정표",                 description: "시간대별 이동·체험·식사 일정" },
      p06_budgetPlan:       { title: "예산 운영 계획서",            description: "수입·지출 항목 상세, 경비 지원 내역" },
      p07_committeeMinutes: { title: "소위원회 회의록",             description: "현장체험학습 심의 소위원회 회의 기록" },
      p08_boardProposal:    { title: "학교운영위원회 의안 제안서",  description: "학교운영위 심의 의안 제출 문서" },
      p09_departureSafety:  { title: "출발일 안전 점검표",          description: "출발 전 차량·학생·인솔 교사 최종 점검" },
      p10_staffAssignment:  { title: "인솔 교사 업무 분장표",       description: "교사별 역할·담당 학급·계획" },
      p11_studentList:      { title: "학생 명단 및 참가 현황",      description: "참가·미참가·요양호·경비지원 대상 학생 목록" },
      p12_accommodationPlan:{ title: "숙박 배정 계획표",            description: "숙소별 방 배정 현황" },
      p13_mealPlan:         { title: "식단 및 식사 계획표",         description: "끼니별 메뉴, 식당 정보" },
      p14_reportForm:       { title: "현장체험학습 결과 보고서",    description: "실시 후 제출하는 결과 정리 양식" },
    };

    const meta = DOC_META[documentId] ?? { title: documentId, description: "" };

    // 컨텍스트 추출
    const school = schoolSnapshot || {};
    const place  = placeInfo  || {};
    const plan   = tripPlan   || {};
    const spCtx  = safetyPickContext || {};

    const schoolName    = spCtx.schoolName    || school.school?.schulNm || plan.schoolName  || "○○학교";
    const grade         = spCtx.grade         || plan.grade       || "○";
    const className     = school.className    || plan.className   || "○";
    const teacherName   = school.teachers?.[0]?.name || plan.teacherName || "담임교사";
    const placeName     = place.name  || plan.placeName  || "○○체험관";
    const placeAddr     = place.address || plan.placeAddress || "";
    const tripType      = plan.type ?? "day";
    const totalStudents = plan.totalStudents ?? 30;
    const nonParticipants = plan.nonParticipants ?? 0;
    const teacherCount  = school.teachers?.length ?? plan.teacherCount ?? 3;
    const tripTitle     = plan.title     || "";
    const tripPurpose   = plan.purpose   || "";
    const startDate     = plan.startDate || "";
    const endDate       = plan.endDate   || "";
    const departureTime = plan.departureTime || "09:00";
    const returnTime    = plan.returnTime    || "17:00";
    const budget        = plan.budget ?? 0;
    const totalBudget   = budget * (totalStudents - nonParticipants);

    const rawDate    = startDate || spCtx.tripDate || plan.tripDate || plan.date || "";
    const tripDate   = formatKoreanDate(rawDate);
    const tripEndDate = endDate ? formatKoreanDate(endDate) : "";

    const transportMap: Record<string, string> = {
      walk: "도보", citybus: "시내버스", bus: "전세버스",
      train: "기차", flight: "항공기", mixed: "복합 이동(버스+기차)",
    };
    const transportLabel = transportMap[plan.transportType ?? "bus"] ?? plan.transportType ?? "전세버스";

    const ctx = {
      schoolName, grade, className, teacherName, placeName, placeAddr,
      tripDate, tripEndDate, totalStudents, nonParticipants, teacherCount,
      departureTime, returnTime, transportLabel, budget, totalBudget,
      tripTitle, tripPurpose, tripType, students, staffInfo,
    };

    // 문서별 특화 프롬프트 생성
    const specificPrompt = getDocumentSpecificPrompt(documentId, ctx);

    let markdownContent = "";
    let totalTokens = 0;
    let geminiError: string | null = null;
    let usedMock = false;

    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini")) {
      console.warn(`[DocGenerate] API 키 없음 → Mock 문서 사용 (${documentId})`);
      geminiError = "GEMINI_API_KEY가 설정되지 않았습니다.";
    } else {
      try {
        console.log(`[DocGenerate] Gemini 호출 시작 (${documentId}), 프롬프트 길이: ${specificPrompt.length}자`);
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(specificPrompt);

        markdownContent = result.response.text().trim();
        totalTokens = result.response.usageMetadata?.totalTokenCount ?? 0;
        console.log(`[DocGenerate] Gemini 성공 (${documentId}): ${totalTokens} 토큰, ${markdownContent.length}자`);
      } catch (err: any) {
        geminiError = err?.message || String(err);
        console.error(`[DocGenerate] Gemini 호출 실패 (${documentId}):`, geminiError);
      }
    }

    // Gemini 실패 시 기본 Mock 문서 생성
    if (!markdownContent) {
      usedMock = true;
      markdownContent = generateMockDocument(documentId, meta.title, ctx);
      console.log(`[DocGenerate] Mock 문서 사용 (${documentId})`);
    }

    const sections = markdownContent
      .split(/\n(?=#{1,3} )/)
      .filter((s) => s.trim())
      .map((s, i) => {
        const lines = s.trim().split("\n");
        const heading = lines[0].replace(/^#{1,3} /, "").trim();
        const body = lines.slice(1).join("\n").trim();
        return { index: i, heading, body, isEdited: false };
      });

    const content = {
      documentId,
      title: meta.title,
      rawMarkdown: markdownContent,
      sections: sections.length > 0
        ? sections
        : [{ index: 0, heading: meta.title, body: markdownContent, isEdited: false }],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, content, tokenUsage: { totalTokens }, usedMock, geminiError });

  } catch (error: any) {
    console.error("[DocGenerate] API 오류:", error);
    return NextResponse.json(
      { error: error.message || "문서 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

function generateMockDocument(documentId: string, title: string, ctx: Record<string, any>): string {
  const {
    schoolName, grade, className, teacherName, placeName, placeAddr,
    tripDate, totalStudents, nonParticipants, teacherCount,
    departureTime = "09:00", returnTime = "17:00",
    tripTitle, tripPurpose, transportLabel = "전세버스",
    budget = 0, totalBudget = 0, tripType,
  } = ctx;
  const participants = totalStudents - (nonParticipants || 0);
  const gradeClass = `${grade}학년 ${className}반`;

  const templates: Record<string, string> = {
    p01_tripPlan: `# ${schoolName} 현장체험학습 실시 계획서

## 1. 목적
- ${tripPurpose || "교과 연계 현장 체험을 통해 학습 내용을 심화하고 공동체 의식을 함양합니다."}
- 실제 생활 속에서 교과서 내용을 직접 체험하여 창의적 사고력을 기릅니다.
- 안전한 활동을 통해 자기 관리 역량 및 협동심을 증진합니다.

## 2. 개요

| 항목 | 내용 |
|------|------|
| 제목 | ${tripTitle || `${gradeClass} 현장체험학습`} |
| 일시 | ${tripDate} ${departureTime} ~ ${returnTime} |
| 장소 | ${placeName} (${placeAddr}) |
| 대상 | ${schoolName} ${gradeClass} ${participants}명 |
| 인솔교사 | ${teacherName} 외 ${teacherCount - 1}명 |
| 교통수단 | ${transportLabel} |
| 유형 | ${tripType === "day" ? "1일형 현장체험학습" : tripType === "training" ? "숙박형 수련활동" : "수학여행"} |

## 3. 세부 일정

| 시간 | 장소 | 활동 내용 |
|------|------|-----------|
| ${departureTime} | 학교 | 집결, 인원 확인, 차량 탑승 |
| 이동 중 | ${transportLabel} | 안전 교육 실시 |
| 도착 후 | ${placeName} | 입장 및 오리엔테이션 |
| 오전 | ${placeName} | 오전 체험 프로그램 |
| 12:00 | 식당 | 중식 및 휴식 |
| 오후 | ${placeName} | 오후 체험 및 정리 활동 |
| ${returnTime} | 학교 | 귀교 및 해산 |

## 4. 안전 관리 계획
- 출발 전 학생 명단 및 건강 상태 확인
- 이동 시 안전벨트 착용 의무화
- 인솔교사 배치: 학생 15명당 1명 이상
- 응급 상황 발생 시 즉시 119 신고 및 보호자 연락
- 미세먼지 비상 시 실내 대체 프로그램 운영

## 5. 예산 계획

| 항목 | 단가 | 인원 | 금액 |
|------|------|------|------|
| 교통비 | - | ${participants}명 | - |
| 체험비 | - | ${participants}명 | - |
| 중식비 | - | ${participants}명 | - |
| **합계** | | **${participants}명** | **${totalBudget.toLocaleString()}원** |

## 6. 행정 사항
- 결재: 담임교사 → 교감 → 교장
- 학부모 동의서 수합 후 출발
- 체험학습 후 10일 이내 결과 보고서 제출`,

    p02_consentForm: `# ${schoolName} 현장체험학습 학부모 안내문

## 학부모 안내문

안녕하세요, ${schoolName} ${gradeClass} 담임교사 ${teacherName}입니다.

${tripDate}에 ${placeName}으로 현장체험학습을 실시할 예정입니다.
이번 체험학습은 교과 학습과 연계하여 학생들의 창의력과 탐구심을 기르는 소중한 기회가 될 것입니다.

**일정**: ${tripDate} ${departureTime} ~ ${returnTime}
**장소**: ${placeName}
**교통**: ${transportLabel}
**경비**: 1인당 ${budget.toLocaleString()}원

안전한 체험학습을 위해 인솔교사 ${teacherCount}명이 동행하며, 만전을 기하겠습니다.

---

## 현장체험학습 참가 동의서

| 항목 | 내용 |
|------|------|
| 학생 성명 | |
| 학년/반 | ${gradeClass} |
| 보호자 성명 | |
| 보호자 연락처 | |
| 알레르기/특이사항 | |
| 비상 연락처 | |

□ 위 현장체험학습 참가에 동의합니다.
□ 위 현장체험학습 참가에 동의하지 않습니다.

서명: 보호자 _________________ (인)

제출 기한: ${tripDate} 일주일 전까지

---

## 카카오톡 공유 메시지

🎒 [${schoolName} ${gradeClass}] 현장체험학습 안내
📅 일시: ${tripDate} ${departureTime}~${returnTime}
📍 장소: ${placeName}
💰 경비: ${budget.toLocaleString()}원
✅ 동의서를 ${tripDate} 일주일 전까지 제출해 주세요!
[동의서 링크]`,

    p09_departureSafety: `# ${schoolName} 현장체험학습 출발일 안전 점검표

점검일시: ${tripDate} ${departureTime}  
점검자: ${teacherName}

## 1. 학생 점검

| 점검 항목 | 확인 | 비고 |
|-----------|------|------|
| 학생 인원 확인 (${participants}명) | □ | |
| 건강 이상자 여부 확인 | □ | |
| 상비약 지참 확인 (보건교사) | □ | |
| 복장 및 준비물 확인 | □ | |
| 비상연락처 카드 지참 | □ | |

## 2. 교통수단(${transportLabel}) 점검

| 점검 항목 | 확인 | 비고 |
|-----------|------|------|
| 차량 보험 가입 확인 | □ | |
| 안전벨트 정상 작동 | □ | |
| 운전기사 면허 확인 | □ | |
| 차량 내 소화기 비치 | □ | |

## 3. 서류 점검

| 점검 항목 | 확인 | 비고 |
|-----------|------|------|
| 학생 명단 | □ | |
| 학부모 동의서 | □ | |
| 비상연락체계표 | □ | |
| 응급처치 키트 | □ | |

## 4. 최종 확인

출발 가능 여부: □ 이상 없음  □ 보완 후 출발  
담임교사 서명: _______________ (인)  
관리자 확인: _______________ (인)`,
  };

  // 특화 템플릿이 있으면 사용, 없으면 범용 양식
  if (templates[documentId]) return templates[documentId];

  return `# ${schoolName} ${title}

## 1. 개요
- **일시**: ${tripDate} ${departureTime} ~ ${returnTime}
- **장소**: ${placeName} (${placeAddr})
- **대상**: ${gradeClass} ${participants}명
- **인솔교사**: ${teacherName} 외 ${teacherCount - 1}명
- **교통수단**: ${transportLabel}

## 2. 세부 내용
(${title}에 해당하는 내용을 아래에 작성합니다.)

## 3. 안전 관련 사항
- 출발 전 안전 교육 실시
- 인솔 교사 배치 기준 준수
- 비상 연락망 구축 및 공유

## 4. 기타
본 문서는 ${schoolName} 현장체험학습 계획에 따라 작성되었습니다.`;
}

function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return "2026년 ○월 ○일";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`;
  } catch {
    return dateStr;
  }
}
