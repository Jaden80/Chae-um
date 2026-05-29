import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";

function isSupabaseMocked() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("your_supabase");
}

export async function POST(req: NextRequest) {
  try {
    const { eventId, placeId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    let schoolName = "세종초등학교";
    let placeName = "국립세종수목원 어린이정원";
    let placeAddress = "세종특별자치시 수목원로 136";
    let grade = 3;
    let subject = "사회";
    let unit = "우리 고장의 모습";

    // 1. Fetch event + place + school data from Supabase
    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();
        const { data: event } = await supabase
          .from("events")
          .select(`
            grade,
            subject,
            unit,
            schools(name),
            selected_place_id,
            places(name, address)
          `)
          .eq("id", eventId)
          .single();

        if (event) {
          grade = event.grade || grade;
          subject = event.subject || subject;
          unit = event.unit || unit;
          if (event.schools) {
            schoolName = (event.schools as any).name || schoolName;
          }
          if (event.places) {
            placeName = (event.places as any).name || placeName;
            placeAddress = (event.places as any).address || placeAddress;
          }
        }
      } catch (err) {
        console.error("Failed to query data from Supabase:", err);
      }
    }

    // 2. Read RAG Manual Chunks
    const chunksPath = path.join(process.cwd(), "data", "manual_chunks.json");
    let manualChunksStr = "";
    try {
      const chunks = JSON.parse(fs.readFileSync(chunksPath, "utf-8"));
      manualChunksStr = chunks.map((c: any) => `[${c.category}] ${c.content}`).join("\n\n");
    } catch (err) {
      console.error("Failed to read manual_chunks.json:", err);
      manualChunksStr = "대규모 동의율 90% 이상, 안전요원 학생 50명당 1명 배치 의무, 숙박형 사전답사 필수.";
    }

    // 3. Read system prompt
    const promptPath = path.join(process.cwd(), "prompts", "basic_plan.md");
    let systemPrompt = "";
    try {
      systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } catch (err) {
      console.error("Failed to read basic_plan.md:", err);
      systemPrompt = "현장체험학습 계획 및 품의서 마크다운 문서를 작성하십시오.";
    }

    // Interpolate system prompt variables
    const formattedPrompt = systemPrompt
      .replace("{manualChunks}", manualChunksStr)
      .replace("{schoolName}", schoolName)
      .replace("{placeName}", placeName)
      .replace("{placeAddress}", placeAddress)
      .replace("{grade}", grade.toString())
      .replace("{subject}", subject)
      .replace("{unit}", unit);

    const userPrompt = `${schoolName} 소속 ${grade}학년 ${subject} 교과 ${unit} 단원 연계 현장체험학습 계획서를 규정에 맞추어 마크다운으로 상세히 작성하시오.`;

    // 4. Call Gemini to generate Markdown
    let generatedMarkdown = "";
    const isGeminiMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_gemini");

    if (!isGeminiMock) {
      try {
        generatedMarkdown = await generateText(formattedPrompt, userPrompt);
      } catch (err) {
        console.error("Gemini basic_plan generation failed, using mock:", err);
      }
    }

    if (!generatedMarkdown) {
      // Mock plan conforming to rules
      generatedMarkdown = `# [○○초등학교] 현장체험학습 계획 및 품의서

## 1. 목적
- 초등학교 ${grade}학년 ${subject} 교과 '${unit}' 단원과 연계된 실제적 현장 관찰을 통해 우리 고장의 자연환경 및 인문환경을 실증적으로 탐색합니다.
- 체험처의 안전인증 프로그램 참가를 통해 단체 활동 중 위급 대처 능력을 기르고 협동심과 공공질서 의식을 자연스럽게 배양합니다.
- 주도적인 현장 과제 수행을 통해 분석적이고 창의적인 자기주도적 학습 능력을 극대화시킵니다.

## 2. 개요
- **일시**: 2026년 ○월 ○일(○요일) 09:00 ~ 16:00
- **장소**: ${placeName} (${placeAddress})
- **대상**: ○○초등학교 ${grade}학년 학생 총 60명 (인솔교사 3명, 안전요원 2명 배치)
- **체험 유형**: 1일형 현장체험학습

## 3. 사전 준비 및 적합성 검토
- **학부모 동의 현황**: 참가 희망 동의율 95% 확보 완료 (현장체험학습 안전관리 매뉴얼 대규모/중규모 의무 비율 기준 만족)
- **안전요원 배치 현황**: 학생 50명당 안전요원 1명 이상 의무 배치 기준(총 60명 대비 교사 3명, 요원 2명으로 총 5명 배치 완료하여 규정 완벽 준수)
- **사전답사 계획**: 사전답사 실시일(2026년 ○월 ○일) 안전시설 및 피난 통로 전원 점검 완료

## 4. 세부 일정
- 09:00 ~ 09:30 : 학교 운동장 집결 및 인원 점검, 차량 승차 전 안전 벨트 착용 지도 및 비상 시 탈출 요령 교육
- 09:30 ~ 10:30 : ${placeName} 안전 이동 (전용 임차 버스 2대, 스쿨존 구역 시속 30km 이하 서행 정밀 준수)
- 10:30 ~ 12:30 : 오전 교과 연계 체험활동 ('${unit}' 연계 식물 관찰 및 안전체험학습 프로그램)
- 12:30 ~ 13:30 : 지정 구역 내 중식, 손 씻기 및 개인 위생 관리 점검, 체험처 내 대피 공간 위치 숙지 교육
- 13:30 ~ 15:00 : 오후 자유 탐색 및 창의 융합 과제 수행, 안전 취약 구역(습지 주변) 교사 및 요원 밀착 감시
- 15:00 ~ 16:00 : 인원 및 소지품 최종 확인 후 버스 승차, 안전하게 학교 귀가 및 하교 지도

## 5. 안전 관리 및 대응 계획 (필수)
### 가. 미세먼지 및 황사 대처 계획
- 현장체험학습 당일 미세먼지 혹은 초미세먼지 경보 발령 시, 야외 야외 실외 관찰 활동을 즉각 전면 중단하며 체험관 내부에서 운영되는 3D 영상관 및 가상체험(VR) 실내 대체 프로그램으로 즉시 전환하여 진행합니다.
### 나. 지진 및 재난 발생 시 행동 요령
- 체험 활동 시작 전 인솔 교사가 대피 동선 및 야외 대피 집결지를 확인 및 교육하고, 실제 지진 등 재난 상황 감지 시 머리를 보호하며 지정 대피로를 통해 건물 외부 광장으로 유도 인솔합니다.
### 다. 감염병 예방 및 응급 환자 이송 계획
- 활동 전 학생 발열 상태를 상시 모니터링하며, 유증상자 발생 시 즉시 격리 부스에 분리 안착시킵니다. 응급 환자 발생 시 대기 차량을 통해 10분 거리의 가장 가까운 종합병원 응급실로 신속히 긴급 이송합니다.

## 6. 소요 예산 (개략 계획)

| 항목 | 계산 내역 | 금액 |
| :--- | :--- | :--- |
| 버스 임차료 | 400,000원 x 2대 | 800,000원 |
| 체험 요금 | 5,000원 x 60명 | 300,000원 |
| 안전 용품비 | 구급약 등 기타 물품 | 50,000원 |
| **합계** | | **1,150,000원** |

## 7. 평가 및 정산 계획
- 체험학습 종료 후 10일 이내에 최종 정산 보고서 작성 및 학교장 내부 결재 승인을 득하고 학급별 정산 내역 및 사후 평가 결과를 교육청 시스템에 정식 기한 내 입력 완료할 예정입니다.
`;
    }

    // 5. Save to Supabase (documents table)
    let docId = Math.random().toString(36).substring(2, 15);
    const mockPdfUrl = `/document/${eventId}/print`;

    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert({
            event_id: eventId,
            type: "basic_plan",
            content: generatedMarkdown,
            file_url: mockPdfUrl,
          })
          .select("id")
          .single();

        if (docError) throw docError;
        docId = docData.id;
      } catch (err) {
        console.error("Failed to save document to Supabase:", err);
      }
    }

    return NextResponse.json({
      success: true,
      documentId: docId,
      content: generatedMarkdown,
      pdfUrl: mockPdfUrl,
    });
  } catch (error: any) {
    console.error("API /document/basic-plan error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate document" }, { status: 500 });
  }
}
